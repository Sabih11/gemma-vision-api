import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ScrollText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

// Minimal inline markdown renderer (headings, bold, paragraphs, lists, hr, em).
function renderMarkdown(md) {
  const lines = md.split('\n');
  const out = [];
  let listBuf = [];
  const flushList = () => {
    if (listBuf.length) {
      out.push(
        <ul key={`ul-${out.length}`} className="my-3 list-disc space-y-1.5 pl-6 text-zinc-300">
          {listBuf.map((item, i) => <li key={i} dangerouslySetInnerHTML={{ __html: inline(item) }} />)}
        </ul>
      );
      listBuf = [];
    }
  };
  const inline = (s) => s
    .replace(/`([^`]+)`/g, '<code class="rounded bg-white/10 px-1 py-0.5 font-mono text-xs">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith('# ')) { flushList(); out.push(<h1 key={out.length} className="mb-4 mt-2 font-heading text-3xl font-semibold tracking-tight md:text-4xl">{line.slice(2)}</h1>); }
    else if (line.startsWith('## ')) { flushList(); out.push(<h2 key={out.length} className="mb-2 mt-7 font-heading text-xl font-semibold tracking-tight">{line.slice(3)}</h2>); }
    else if (line.startsWith('- ')) { listBuf.push(line.slice(2)); }
    else if (line === '---') { flushList(); out.push(<hr key={out.length} className="my-6 border-white/10" />); }
    else if (line === '') { flushList(); }
    else { flushList(); out.push(<p key={out.length} className="my-3 leading-relaxed text-zinc-300" dangerouslySetInnerHTML={{ __html: inline(line) }} />); }
  }
  flushList();
  return out;
}

export default function Terms() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/legal/terms').then(({ data }) => setData(data)).catch((e) => setErr(e.message));
  }, []);

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white" data-testid="terms-page">
      <div className="blob -top-24 -left-24 h-[360px] w-[360px] bg-blue-700/40" />
      <div className="blob right-[-10%] bottom-[-20%] h-[360px] w-[360px] bg-fuchsia-600/30" />

      <header className="sticky top-0 z-20 border-b border-white/5 bg-zinc-950/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <Link
            to="/dashboard"
            data-testid="terms-back-link"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-200 transition-all hover:border-white/20 hover:bg-white/[0.08]"
          >
            <ArrowLeft size={14} />
            Back
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            v{data?.version || '…'} · {data?.effective_date || ''}
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-300 backdrop-blur-xl"
        >
          <ScrollText size={12} className="text-blue-300" /> Legal
        </motion.div>

        {err && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{err}</p>
        )}

        <article data-testid="terms-content" className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 backdrop-blur-2xl sm:p-10">
          {data ? renderMarkdown(data.content) : (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="shimmer h-3 w-full rounded" />
              ))}
            </div>
          )}
        </article>
      </main>
    </div>
  );
}
