import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Sparkles, Image as ImgIcon, AudioLines, Menu, X } from 'lucide-react';
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/history');
      setHistory(data || []);
    } catch (e) {
      console.error('history fetch failed', e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/history');
        if (!cancelled) setHistory(data || []);
      } catch (e) {
        console.error('history fetch failed', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-zinc-950 text-white" data-testid="dashboard-page">
      {/* Ambient background */}
      <div className="blob -top-24 -left-24 h-[360px] w-[360px] bg-blue-700/60 sm:h-[460px] sm:w-[460px]" />
      <div className="blob bottom-[-15%] right-[-10%] h-[320px] w-[320px] bg-fuchsia-600/40 sm:h-[420px] sm:w-[420px]" />

      {/* Sticky glass header */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-zinc-950/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex min-w-0 items-center gap-2.5"
          >
            <div className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-glow ring-1 ring-white/20">
              <span className="font-heading text-base font-bold">O</span>
            </div>
            <p className="font-heading text-lg font-semibold tracking-tight">OMNI<span className="text-blue-400">.</span></p>
          </motion.div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile-only history toggle */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              data-testid="open-history-drawer"
              aria-label="Open history"
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-200 transition-all hover:border-white/20 hover:bg-white/[0.08] lg:hidden"
            >
              <Menu size={16} />
            </button>

            {/* User chip — compact pill on small, full pill on >=sm */}
            <div
              data-testid="user-chip"
              className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-3 backdrop-blur-xl sm:gap-3 sm:pl-1.5 sm:pr-4"
            >
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || user.email}
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 flex-none rounded-full object-cover ring-1 ring-white/20"
                />
              ) : (
                <div className="grid h-8 w-8 flex-none place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold ring-1 ring-white/20">
                  {(user?.name || user?.email || '?').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="hidden min-w-0 max-w-[160px] flex-col sm:flex">
                <p data-testid="user-name" className="truncate text-sm font-semibold leading-tight">
                  {user?.name || user?.email}
                </p>
                {user?.name && user?.email && (
                  <p className="truncate text-[11px] text-zinc-400">{user.email}</p>
                )}
              </div>
            </div>

            <motion.button
              type="button"
              onClick={logout}
              data-testid="logout-button"
              {...tap}
              aria-label="Logout"
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 transition-all hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
            >
              <LogOut size={15} />
              <span className="ml-2 hidden text-xs font-semibold tracking-wide sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[1fr_320px] lg:gap-8 lg:py-10 xl:grid-cols-[1fr_360px]">
        <section className="min-w-0 space-y-6 sm:space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-300 backdrop-blur-xl">
              <Sparkles size={12} className="text-blue-300" />
              Workspace
            </p>
            <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
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

        {/* Desktop sidebar */}
        <motion.aside
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="hidden flex-col gap-4 lg:sticky lg:top-[5.5rem] lg:flex lg:max-h-[calc(100vh-7rem)] lg:self-start"
        >
          <SidebarHeader count={history.length} />
          <div className="min-h-0 flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
            <HistoryList items={history} onChanged={refresh} />
          </div>
        </motion.aside>
      </main>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setDrawerOpen(false)}
          />
        )}
        {drawerOpen && (
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 z-40 flex h-full w-[85vw] max-w-sm flex-col border-l border-white/10 bg-zinc-950/95 p-5 backdrop-blur-2xl lg:hidden"
            data-testid="history-drawer"
          >
            <div className="mb-5 flex items-center justify-between">
              <SidebarHeader count={history.length} />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                aria-label="Close history"
              >
                <X size={14} />
              </button>
            </div>
            <div className="-mr-2 flex-1 overflow-y-auto pr-2">
              <HistoryList items={history} onChanged={refresh} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <footer className="relative z-10 border-t border-white/5 bg-zinc-950/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-3 text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 sm:flex-row sm:items-center sm:px-6 sm:py-4">
          <span>Omni · Gemma Vision · Whisper-1 · Emergent Auth</span>
          <div className="flex items-center gap-4">
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="dashboard-terms-link"
              className="transition-colors hover:text-zinc-200"
            >
              Terms
            </a>
            <span>v1.0 · iOS app available</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SidebarHeader({ count }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">Recent</h2>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500" data-testid="history-count">
        {count} item{count === 1 ? '' : 's'}
      </span>
    </div>
  );
}

function Tab({ active, onClick, children, icon, testId }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`relative z-10 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition-colors sm:px-4 ${
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
