import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, Loader2, Send, Sparkles, X } from 'lucide-react';
import { api } from '../lib/api';
import { popIn, tap } from '../lib/motion';
import WhatsAppShare from './WhatsAppShare';

export default function VisionPanel({ onSaved }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [question, setQuestion] = useState('Describe this image in detail.');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const accept = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult('');
    setError('');
  };

  const onFile = (e) => accept(e.target.files?.[0]);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    accept(e.dataTransfer.files?.[0]);
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
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 p-6 backdrop-blur-2xl md:p-8"
      data-testid="vision-panel"
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-300">
            <Sparkles size={11} /> Image
          </span>
          <h2 className="font-heading text-2xl font-medium tracking-tight">Image Recognition</h2>
        </div>
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Gemma Vision</span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <label
          htmlFor="vision-file"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          data-testid="vision-upload-label"
          className={`group relative flex min-h-[240px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
            dragOver
              ? 'border-blue-400 bg-blue-500/10'
              : 'border-zinc-700/70 bg-zinc-950/40 hover:border-blue-500/50 hover:bg-blue-500/5'
          }`}
        >
          {preview ? (
            <motion.div variants={popIn} initial="initial" animate="animate" className="relative">
              <img src={preview} alt="preview" className="max-h-56 rounded-xl object-contain shadow-lift ring-1 ring-white/10" />
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); clear(); }}
                data-testid="vision-clear-button"
                className="absolute -right-3 -top-3 grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-zinc-900/90 backdrop-blur hover:bg-zinc-800"
              >
                <X size={14} />
              </button>
            </motion.div>
          ) : (
            <>
              <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-blue-300 transition-all group-hover:scale-110 group-hover:bg-blue-500/15">
                <ImagePlus size={22} />
              </div>
              <p className="text-sm font-medium text-zinc-200">Drop an image or click to upload</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">png · jpg · webp</p>
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

        <div className="flex flex-col gap-3">
          <textarea
            data-testid="vision-question-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={5}
            className="resize-none rounded-2xl border border-white/10 bg-zinc-950/60 p-4 text-sm leading-relaxed text-white placeholder-zinc-500 transition-all focus:border-blue-400/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            placeholder="Ask anything about this image…"
          />
          <motion.button
            type="button"
            onClick={submit}
            disabled={!file || loading || !question.trim()}
            data-testid="vision-submit-button"
            whileHover={{ y: -1 }}
            {...tap}
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-glow transition-all hover:from-blue-400 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            <span className="absolute inset-y-0 -left-12 w-12 -skew-x-12 bg-white/20 opacity-0 transition-all duration-700 group-hover:left-[105%] group-hover:opacity-100" />
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {loading ? 'Analyzing…' : 'Analyze image'}
          </motion.button>
          <AnimatePresence>
            {error && (
              <motion.p
                key="err"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                data-testid="vision-error"
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="mt-6 rounded-2xl border border-white/10 bg-zinc-950/50 p-5 shadow-glowSoft"
            data-testid="vision-result"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Result</p>
              <WhatsAppShare text={result} testId="vision-whatsapp-share" />
            </div>
            <p className="whitespace-pre-wrap text-base leading-relaxed text-zinc-100">{result}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
