import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Sparkles, Image as ImgIcon, AudioLines } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { tap } from '../lib/motion';
import VisionPanel from '../components/VisionPanel';
import TranscribePanel from '../components/TranscribePanel';
import HistoryList from '../components/HistoryList';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('vision');

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/history');
      setHistory(data || []);
    } catch (e) {
      console.error('history fetch failed', e);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-white" data-testid="dashboard-page">
      {/* Ambient background */}
      <div className="blob -top-32 -left-32 h-[480px] w-[480px] bg-blue-700/60" />
      <div className="blob bottom-[-15%] right-[-10%] h-[420px] w-[420px] bg-fuchsia-600/40" />
      <div className="bg-grain absolute inset-0" />

      {/* Sticky glass header */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-zinc-950/60 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-glow ring-1 ring-white/20">
              <span className="font-heading text-base font-bold">O</span>
            </div>
            <div>
              <p className="font-heading text-lg font-semibold leading-none tracking-tight">OMNI.</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">multimodal · ai</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-3">
            {user?.picture && (
              <img
                src={user.picture}
                alt={user.name || user.email}
                referrerPolicy="no-referrer"
                className="h-9 w-9 rounded-full border border-white/10 object-cover ring-1 ring-white/10"
              />
            )}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight" data-testid="user-name">{user?.name || user?.email}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">{user?.email}</p>
            </div>
            <motion.button
              type="button"
              onClick={logout}
              data-testid="logout-button"
              {...tap}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-200 transition-all hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={14} />
              Logout
            </motion.button>
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-3">
        <section className="space-y-8 lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-300 backdrop-blur-xl">
              <Sparkles size={12} className="text-blue-300" />
              Workspace
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight md:text-5xl">
              Hey {(user?.name || 'there').split(' ')[0]}. <br />
              <span className="bg-gradient-to-br from-blue-300 via-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
                What shall we analyze today?
              </span>
            </h1>
          </motion.div>

          {/* Animated tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="relative inline-flex rounded-2xl border border-white/10 bg-zinc-900/40 p-1 backdrop-blur-xl"
            data-testid="mode-tabs"
          >
            <Tab active={tab === 'vision'} onClick={() => setTab('vision')} testId="tab-vision" icon={<ImgIcon size={14} />}>Image</Tab>
            <Tab active={tab === 'audio'} onClick={() => setTab('audio')} testId="tab-audio" icon={<AudioLines size={14} />}>Audio</Tab>
          </motion.div>

          <AnimatePresence mode="wait">
            {tab === 'vision' ? (
              <motion.div
                key="vp"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <VisionPanel onSaved={refresh} />
              </motion.div>
            ) : (
              <motion.div
                key="ap"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <TranscribePanel onSaved={refresh} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <motion.aside
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="space-y-4 lg:sticky lg:top-[5.5rem] lg:self-start"
        >
          <div className="flex items-end justify-between">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">Recent</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500" data-testid="history-count">
              {history.length} item{history.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <HistoryList items={history} onChanged={refresh} />
          </div>
        </motion.aside>
      </main>

      <footer className="relative z-10 border-t border-white/5 bg-zinc-950/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            Omni · Gemma Vision · Whisper-1 · Emergent Auth
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            v1.0 · iOS app available
          </p>
        </div>
      </footer>
    </div>
  );
}

function Tab({ active, onClick, children, icon, testId }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`relative z-10 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition-colors ${
        active ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
      }`}
    >
      {active && (
        <motion.span
          layoutId="tab-pill"
          className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-glow"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      {icon}
      {children}
    </button>
  );
}
