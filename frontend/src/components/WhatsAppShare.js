import React from 'react';
import { WhatsappLogo } from '@phosphor-icons/react';

export default function WhatsAppShare({ text, label = 'WhatsApp', testId = 'whatsapp-share-button' }) {
  const onClick = () => {
    const trimmed = (text || '').toString().slice(0, 3500);
    const url = `https://wa.me/?text=${encodeURIComponent(trimmed)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!text}
      data-testid={testId}
      className="btn-press bg-whats text-white border-2 border-black px-3 py-2 font-bold uppercase tracking-wide text-xs flex items-center gap-2 shadow-brutSm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <WhatsappLogo size={16} weight="bold" />
      {label}
    </button>
  );
}
