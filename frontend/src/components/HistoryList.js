import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Image as ImgIcon, AudioLines, MessageCircle } from 'lucide-react';
import { api } from '../lib/api';
import { fadeUp, stagger } from '../lib/motion';
import WhatsAppShare from './WhatsAppShare';

const ICONS = {
  image: ImgIcon,
  transcribe: AudioLines,
  audio: AudioLines,
  chat: MessageCircle,
};

const ACCENT = {
  image: 'from-blue-500/20 to-indigo-500/10 text-blue-300 border-blue-400/30',
  transcribe: 'from-rose-500/20 to-red-500/10 text-rose-300 border-rose-400/30',
  audio: 'from-rose-500/20 to-red-500/10 text-rose-300 border-rose-400/30',
  chat: 'from-zinc-500/20 to-zinc-700/10 text-zinc-300 border-zinc-400/30',
};

function timeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

export default function HistoryList({ items, onChanged }) {
  const remove = async (id) => {
    try {
      await api.delete(`/history/${id}`);
      onChanged && onChanged();
    } catch (e) {
      console.error('history delete failed', e);
    }
  };

  if (!items.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-6 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500"
        data-testid="history-empty"
      >
        No history yet · run an analysis to populate
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="flex flex-col gap-3"
      data-testid="history-list"
    >
      <AnimatePresence initial={false}>
        {items.map((it) => {
          const Icon = ICONS[it.kind] || MessageCircle;
          const accent = ACCENT[it.kind] || ACCENT.chat;
          const shareText = `${it.prompt}\n\n— ${it.response}`;
          return (
            <motion.article
              key={it.id}
              variants={fadeUp}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.25 }}
              data-testid={`history-item-${it.id}`}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-4 backdrop-blur-xl transition-colors hover:border-white/15 hover:bg-zinc-900/70"
            >
              <header className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`grid h-7 w-7 flex-none place-items-center rounded-lg border bg-gradient-to-br ${accent}`}>
                    <Icon size={12} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">{it.kind}</span>
                  <span className="font-mono text-[10px] tracking-[0.18em] text-zinc-600">·</span>
                  <span className="font-mono text-[10px] tracking-[0.18em] text-zinc-500">{timeAgo(it.created_at)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  data-testid={`history-delete-${it.id}`}
                  className="grid h-7 w-7 flex-none place-items-center rounded-lg border border-white/5 bg-white/[0.02] text-zinc-500 opacity-0 transition-all hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </header>
              <p className="truncate text-sm font-semibold text-zinc-100" title={it.prompt}>{it.prompt}</p>
              <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-zinc-400">{it.response}</p>
              <div className="mt-3 flex justify-end">
                <WhatsAppShare text={shareText} testId={`history-whatsapp-${it.id}`} label="Share" />
              </div>
            </motion.article>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
