import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioLines, Loader2, Mic, Square, Upload, X } from 'lucide-react';
import { api } from '../lib/api';
import { micPulse, popIn, tap } from '../lib/motion';
import WhatsAppShare from './WhatsAppShare';

export default function TranscribePanel({ onSaved }) {
  const [file, setFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const audioUrlRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => () => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
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
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (e) {
      setError('Microphone permission denied or unavailable.');
    }
  };

  const stopRecord = () => {
    mediaRef.current?.stop();
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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

  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 p-6 backdrop-blur-2xl md:p-8"
      data-testid="transcribe-panel"
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-300">
            <AudioLines size={11} /> Audio
          </span>
          <h2 className="font-heading text-2xl font-medium tracking-tight">Audio Transcribe</h2>
        </div>
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Whisper-1</span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-zinc-950/40 p-6 text-center">
          <AnimatePresence mode="wait">
            {!recording ? (
              <motion.button
                key="mic"
                type="button"
                onClick={startRecord}
                data-testid="transcribe-record-button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.06 }}
                {...tap}
                className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-recording transition-all"
              >
                <Mic size={28} />
              </motion.button>
            ) : (
              <motion.button
                key="stop"
                type="button"
                onClick={stopRecord}
                data-testid="transcribe-stop-button"
                animate={micPulse}
                className="grid h-20 w-20 place-items-center rounded-full bg-red-500 text-white"
              >
                <Square size={26} fill="currentColor" />
              </motion.button>
            )}
          </AnimatePresence>
          <p className="text-sm font-medium text-zinc-300">
            {recording ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                Recording · <span className="font-mono">{mmss}</span>
              </span>
            ) : (
              'Tap to record or upload a file'
            )}
          </p>

          <label
            htmlFor="audio-file"
            data-testid="transcribe-upload-label"
            className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-200 transition-all hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-blue-200"
          >
            <Upload size={14} />
            Upload audio file
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

        <div className="flex flex-col gap-3">
          {file ? (
            <motion.div
              variants={popIn}
              initial="initial"
              animate="animate"
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-950/60 p-3"
              data-testid="transcribe-file-preview"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-rose-300">
                  <AudioLines size={16} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-100">{file.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clear}
                data-testid="transcribe-clear-button"
                className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-zinc-900/70 hover:bg-zinc-800"
              >
                <X size={14} />
              </button>
            </motion.div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-zinc-800 p-6 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              No audio loaded yet
            </div>
          )}

          {audioUrlRef.current && (
            <audio
              data-testid="transcribe-audio-preview"
              src={audioUrlRef.current}
              controls
              className="w-full rounded-xl"
            />
          )}

          <motion.button
            type="button"
            onClick={submit}
            disabled={!file || loading}
            data-testid="transcribe-submit-button"
            whileHover={{ y: -1 }}
            {...tap}
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 px-6 py-3.5 text-sm font-semibold text-white shadow-recording transition-all hover:from-rose-400 hover:to-red-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            <span className="absolute inset-y-0 -left-12 w-12 -skew-x-12 bg-white/20 opacity-0 transition-all duration-700 group-hover:left-[105%] group-hover:opacity-100" />
            {loading ? <Loader2 size={16} className="animate-spin" /> : <AudioLines size={16} />}
            {loading ? 'Transcribing…' : 'Transcribe'}
          </motion.button>

          <AnimatePresence>
            {error && (
              <motion.p
                key="err"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                data-testid="transcribe-error"
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {text && (
          <motion.div
            key="trx"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="mt-6 rounded-2xl border border-white/10 bg-zinc-950/50 p-5 shadow-glowSoft"
            data-testid="transcribe-result"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Transcript</p>
              <WhatsAppShare text={text} testId="transcribe-whatsapp-share" />
            </div>
            <p className="whitespace-pre-wrap text-base leading-relaxed text-zinc-100">{text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
