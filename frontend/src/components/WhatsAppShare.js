import React from 'react';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { tap } from '../lib/motion';

export default function WhatsAppShare({ text, label = 'Share to WhatsApp', testId = 'whatsapp-share-button' }) {
  const onClick = () => {
    const trimmed = (text || '').toString().slice(0, 3500);
    const url = `https://wa.me/?text=${encodeURIComponent(trimmed)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!text}
      data-testid={testId}
      {...tap}
      className="group inline-flex items-center gap-2 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 px-4 py-2 text-xs font-semibold text-[#25D366] transition-all hover:border-[#25D366] hover:bg-[#25D366] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Share2 size={14} className="transition-transform group-hover:rotate-12" />
      {label}
    </motion.button>
  );
}
