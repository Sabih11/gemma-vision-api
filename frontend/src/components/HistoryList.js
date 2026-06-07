import React from 'react';
import { Trash, ImageSquare, Microphone, ChatCircleDots } from '@phosphor-icons/react';
import { api } from '../lib/api';
import WhatsAppShare from './WhatsAppShare';

const ICONS = {
  image: ImageSquare,
  transcribe: Microphone,
  audio: Microphone,
  chat: ChatCircleDots,
};

const BADGES = {
  image: 'bg-klein',
  transcribe: 'bg-signal',
  audio: 'bg-signal',
  chat: 'bg-black',
};

export default function HistoryList({ items, onChanged }) {
  const remove = async (id) => {
    try {
      await api.delete(`/history/${id}`);
      onChanged && onChanged();
    } catch (e) {
      console.error(e);
    }
  };

  if (!items.length) {
    return (
      <div className="border-2 border-dashed border-zinc-400 bg-zinc-50 p-6 text-center font-mono text-xs uppercase tracking-widest text-zinc-500" data-testid="history-empty">
        No history yet · run an analysis to populate
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="history-list">
      {items.map((it) => {
        const Icon = ICONS[it.kind] || ChatCircleDots;
        const badge = BADGES[it.kind] || 'bg-black';
        const shareText = `${it.prompt}\n\n— ${it.response}`;
        return (
          <article
            key={it.id}
            data-testid={`history-item-${it.id}`}
            className="border-2 border-black bg-white p-4 hover:shadow-brut transition-all"
          >
            <header className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`${badge} text-white border border-black p-1`}>
                  <Icon size={12} weight="bold" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                  {it.kind}
                </span>
                <span className="font-mono text-[10px] tracking-widest text-zinc-400">
                  {new Date(it.created_at).toLocaleString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => remove(it.id)}
                data-testid={`history-delete-${it.id}`}
                className="border-2 border-black p-1 hover:bg-black hover:text-white"
                title="Delete"
              >
                <Trash size={12} weight="bold" />
              </button>
            </header>
            <p className="font-bold text-sm mb-1 truncate" title={it.prompt}>{it.prompt}</p>
            <p className="text-sm text-zinc-700 line-clamp-3 whitespace-pre-wrap">{it.response}</p>
            <div className="mt-3 flex justify-end">
              <WhatsAppShare text={shareText} testId={`history-whatsapp-${it.id}`} label="Share" />
            </div>
          </article>
        );
      })}
    </div>
  );
}
