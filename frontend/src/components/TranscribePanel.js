import React, { useEffect, useRef, useState } from 'react';
import { Microphone, MusicNotes, Stop, UploadSimple, X } from '@phosphor-icons/react';
import { api } from '../lib/api';
import WhatsAppShare from './WhatsAppShare';

export default function TranscribePanel({ onSaved }) {
  const [file, setFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const audioUrlRef = useRef(null);

  useEffect(() => () => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = URL.createObjectURL(f);
    setText('');
    setError('');
  };

  const startRecord = async () => {
    setError('');
    setText('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        const ext = mime.includes('webm') ? 'webm' : 'm4a';
        const f = new File([blob], `recording.${ext}`, { type: mime });
        setFile(f);
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = URL.createObjectURL(f);
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      mediaRef.current = rec;
      setRecording(true);
    } catch (e) {
      setError('Microphone permission denied or unavailable.');
    }
  };

  const stopRecord = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const clear = () => {
    setFile(null);
    setText('');
    setError('');
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  };

  const submit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setText('');
    try {
      const fd = new FormData();
      fd.append('audio', file);
      const { data } = await api.post('/transcribe', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setText(data.text);
      onSaved && onSaved();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Transcription failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="border-2 border-black bg-white shadow-brut p-6"
      data-testid="transcribe-panel"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="bg-signal text-white text-xs font-mono uppercase tracking-widest px-2 py-1 border border-black">AUDIO</span>
          <h2 className="font-heading font-bold text-2xl tracking-tight">Audio Transcribe</h2>
        </div>
        <span className="text-xs font-mono uppercase tracking-widest text-zinc-600">Whisper-1</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <div className="border-2 border-black bg-zinc-50 p-5 min-h-[220px] flex flex-col items-center justify-center text-center gap-4">
            {!recording ? (
              <button
                type="button"
                onClick={startRecord}
                data-testid="transcribe-record-button"
                className="btn-press bg-black text-white border-2 border-black p-5 shadow-brut hover:shadow-brutSm hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                <Microphone size={32} weight="bold" />
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecord}
                data-testid="transcribe-stop-button"
                className="recording bg-signal text-white border-2 border-black p-5 rounded-full"
              >
                <Stop size={32} weight="fill" />
              </button>
            )}
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-700">
              {recording ? 'Recording… tap to stop' : 'Tap mic or upload audio'}
            </p>

            <label
              htmlFor="audio-file"
              className="cursor-pointer flex items-center gap-2 font-bold uppercase text-sm tracking-wide underline underline-offset-4 hover:text-klein"
              data-testid="transcribe-upload-label"
            >
              <UploadSimple size={16} weight="bold" />
              Upload file
              <input
                id="audio-file"
                data-testid="transcribe-file-input"
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.mp4"
                className="hidden"
                onChange={onFile}
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-3 justify-between">
          {file ? (
            <div className="border-2 border-black bg-white p-3 flex items-center justify-between gap-3" data-testid="transcribe-file-preview">
              <div className="flex items-center gap-3 min-w-0">
                <MusicNotes size={20} weight="bold" />
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{file.name}</p>
                  <p className="font-mono text-xs uppercase tracking-widest text-zinc-600">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clear}
                data-testid="transcribe-clear-button"
                className="border-2 border-black p-1 hover:bg-black hover:text-white"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-zinc-400 bg-zinc-50 p-6 text-center font-mono text-xs uppercase tracking-widest text-zinc-500">
              No audio loaded
            </div>
          )}

          {audioUrlRef.current && (
            <audio
              data-testid="transcribe-audio-preview"
              src={audioUrlRef.current}
              controls
              className="w-full border-2 border-black"
            />
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!file || loading}
            data-testid="transcribe-submit-button"
            className="btn-press bg-signal text-white border-2 border-black px-6 py-3 font-bold uppercase tracking-wide flex items-center justify-center gap-2 shadow-brut hover:shadow-brutSm hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Transcribing…' : 'Transcribe'}
          </button>

          {error && (
            <p data-testid="transcribe-error" className="border-2 border-signal bg-signal/10 text-signal p-3 font-mono text-xs uppercase tracking-widest">
              {error}
            </p>
          )}
        </div>
      </div>

      {text && (
        <div className="mt-6 border-2 border-black bg-zinc-50 p-5 shadow-brut" data-testid="transcribe-result">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-600">Transcript</p>
            <WhatsAppShare text={text} testId="transcribe-whatsapp-share" />
          </div>
          <p className="whitespace-pre-wrap font-body text-base leading-relaxed">{text}</p>
        </div>
      )}
    </section>
  );
}
