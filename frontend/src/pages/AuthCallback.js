import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash || '';
    const match = hash.match(/session_id=([^&]+)/);
    const sessionId = match ? decodeURIComponent(match[1]) : null;

    (async () => {
      if (!sessionId) {
        navigate('/login', { replace: true });
        return;
      }
      try {
        const { data } = await api.post('/auth/google', { session_id: sessionId });
        // Commit user state synchronously so <Protected> sees it on the next render
        flushSync(() => {
          setUser(data.user);
        });
        // navigate AFTER user is committed — Routes will now match /dashboard with user truthy
        navigate('/dashboard', { replace: true });
      } catch (e) {
        console.error('Auth exchange failed', e);
        navigate('/login', { replace: true });
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 backdrop-blur-xl"
      >
        <Loader2 size={16} className="animate-spin text-blue-300" />
        <span className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-300">Signing you in…</span>
      </motion.div>
    </div>
  );
}
