import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, ScrollText, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import { tap } from '../lib/motion';

/**
 * Blocks the dashboard with a modal until the current user accepts the latest T&C version.
 * Stores acceptance in MongoDB via /api/legal/accept.
 */
export default function TermsGate({ children }) {
  const [accepted, setAccepted] = useState(null); // null = loading, true = ok, false = needs gate
  const [version, setVersion] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/legal/status').then(({ data }) => {
      if (!active) return;
      setVersion(data.current_version);
      setAccepted(!!data.accepted);
    }).catch(() => active && setAccepted(true)); // fail-open so the app is usable if the check fails
    return () => { active = false; };
  }, []);

  const acceptNow = async () => {
    setSubmitting(true);
    setErr('');
    try {
      await api.post('/legal/accept', { version });
      setAccepted(true);
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message || 'Could not record your acceptance.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {children}
      <AnimatePresence>
        {accepted === false && (
          <motion.div
            key="terms-gate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-md sm:items-center sm:p-6"
            data-testid="terms-gate"
          >
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg overflow-hidden rounded-t-3xl border border-white/10 bg-zinc-950/95 p-6 backdrop-blur-2xl sm:rounded-3xl"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-300">
                <ScrollText size={12} className="text-blue-300" /> Terms · v{version}
              </div>
              <h2 className="font-heading text-2xl font-semibold tracking-tight">Before we begin</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                Omni sends your uploaded images to <strong className="text-white">HuggingFace · Gemma Vision</strong>{' '}
                and your audio to <strong className="text-white">OpenAI Whisper</strong> for processing. Sharing
                opens a standard WhatsApp link. We store your sign-in details, sessions, and your prompt/response
                history so you can review them later.
              </p>

              <ul className="my-5 space-y-2.5 text-sm text-zinc-300">
                <Bullet>You must be 13+ and follow the acceptable-use rules.</Bullet>
                <Bullet>Do not upload sensitive personal data (IDs, medical, payment).</Bullet>
                <Bullet>AI outputs can be inaccurate — verify before relying on them.</Bullet>
                <Bullet>You can delete any history item anytime.</Bullet>
              </ul>

              <Link
                to="/terms"
                data-testid="terms-read-full-link"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-300 underline-offset-4 hover:underline"
              >
                Read the full terms <ExternalLink size={12} />
              </Link>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 transition-colors hover:bg-white/[0.06]">
                <input
                  type="checkbox"
                  data-testid="terms-confirm-checkbox"
                  checked={confirm}
                  onChange={(e) => setConfirm(e.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-none cursor-pointer accent-blue-500"
                />
                <span className="text-sm text-zinc-200">
                  I have read and agree to the Omni Terms of Service (v{version}).
                </span>
              </label>

              {err && (
                <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300" data-testid="terms-error">
                  {err}
                </p>
              )}

              <motion.button
                type="button"
                onClick={acceptNow}
                disabled={!confirm || submitting}
                data-testid="terms-accept-button"
                whileHover={confirm && !submitting ? { y: -1 } : {}}
                {...tap}
                className="group relative mt-5 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-glow transition-all hover:from-blue-400 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                <span className="pointer-events-none absolute inset-y-0 -left-12 w-12 -skew-x-12 bg-white/20 opacity-0 transition-all duration-700 group-hover:left-[105%] group-hover:opacity-100" />
                <Check size={16} />
                {submitting ? 'Saving…' : 'I agree — continue'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Bullet({ children }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-blue-400" />
      <span>{children}</span>
    </li>
  );
}
