import React, { useState } from 'react';
import { ImageSquare, PaperPlaneRight, X } from '@phosphor-icons/react';
import { api } from '../lib/api';
import WhatsAppShare from './WhatsAppShare';

export default function VisionPanel({ onSaved }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [question, setQuestion] = useState('Describe this image in detail.');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult('');
    setError('');
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
    setResult('');
    setError('');
  };

  const submit = async () => {
    if (!file || !question.trim()) return;
    setLoading(true);
    setError('');
    setResult('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('question', question);
      const { data } = await api.post('/ask', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data.result);
      onSaved && onSaved();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="border-2 border-black bg-white shadow-brut p-6"
      data-testid="vision-panel"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="bg-klein text-white text-xs font-mono uppercase tracking-widest px-2 py-1 border border-black">IMAGE</span>
          <h2 className="font-heading font-bold text-2xl tracking-tight">Image Recognition</h2>
        </div>
        <span className="text-xs font-mono uppercase tracking-widest text-zinc-600">Gemma Vision</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <label
            htmlFor="vision-file"
            data-testid="vision-upload-label"
            className="cursor-pointer border-2 border-dashed border-black bg-zinc-50 hover:bg-zinc-100 p-6 flex flex-col items-center justify-center min-h-[220px] text-center transition-colors"
          >
            {preview ? (
              <div className="relative">
                <img src={preview} alt="preview" className="max-h-48 border-2 border-black" />
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); clear(); }}
                  data-testid="vision-clear-button"
                  className="absolute -top-3 -right-3 bg-white border-2 border-black p-1"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>
            ) : (
              <>
                <ImageSquare size={36} weight="bold" />
                <p className="font-bold uppercase tracking-wide mt-3">Upload image</p>
                <p className="font-mono text-xs uppercase tracking-widest text-zinc-600 mt-1">PNG · JPG · WEBP</p>
              </>
            )}
            <input
              id="vision-file"
              data-testid="vision-file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFile}
            />
          </label>
        </div>

        <div className="flex flex-col gap-3">
          <textarea
            data-testid="vision-question-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={5}
            className="border-2 border-black bg-white p-3 font-body text-base placeholder:text-zinc-500 focus:outline-none focus:ring-0 resize-none"
            placeholder="Ask anything about this image..."
          />
          <button
            type="button"
            onClick={submit}
            disabled={!file || loading || !question.trim()}
            data-testid="vision-submit-button"
            className="btn-press bg-klein text-white border-2 border-black px-6 py-3 font-bold uppercase tracking-wide flex items-center justify-center gap-2 shadow-brut hover:shadow-brutSm hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperPlaneRight size={18} weight="bold" />
            {loading ? 'Analyzing…' : 'Analyze image'}
          </button>
          {error && (
            <p
              data-testid="vision-error"
              className="border-2 border-signal bg-signal/10 text-signal p-3 font-mono text-xs uppercase tracking-widest"
            >
              {error}
            </p>
          )}
        </div>
      </div>

      {result && (
        <div className="mt-6 border-2 border-black bg-zinc-50 p-5 shadow-brut" data-testid="vision-result">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-600">Result</p>
            <WhatsAppShare text={result} testId="vision-whatsapp-share" />
          </div>
          <p className="whitespace-pre-wrap font-body text-base leading-relaxed">{result}</p>
        </div>
      )}
    </section>
  );
}
