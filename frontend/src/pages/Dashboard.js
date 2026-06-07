import React, { useCallback, useEffect, useState } from 'react';
import { SignOut, Sparkle } from '@phosphor-icons/react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
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
    <div className="min-h-screen bg-white" data-testid="dashboard-page">
      {/* Header */}
      <header className="border-b-2 border-black bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black flex items-center justify-center">
              <span className="text-white font-heading font-black tracking-tighter">O</span>
            </div>
            <div>
              <p className="font-heading font-black text-xl tracking-tighter leading-none">OMNI<span className="text-klein">.</span></p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">multimodal · ai</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user?.picture && (
              <img
                src={user.picture}
                alt={user.name || user.email}
                className="w-9 h-9 border-2 border-black object-cover"
              />
            )}
            <div className="hidden sm:block text-right">
              <p className="font-bold text-sm leading-tight" data-testid="user-name">{user?.name || user?.email}</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              data-testid="logout-button"
              className="btn-press bg-white border-2 border-black px-3 py-2 font-bold uppercase tracking-wide text-xs flex items-center gap-2 hover:bg-black hover:text-white"
            >
              <SignOut size={14} weight="bold" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-600 mb-2 flex items-center gap-2">
              <Sparkle size={14} weight="bold" /> Workspace
            </p>
            <h1 className="font-heading text-4xl md:text-5xl font-black tracking-tighter leading-none">
              Hey {(user?.name || 'there').split(' ')[0]}. <br />
              <span className="text-klein">What shall we analyze today?</span>
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-2 border-black w-fit" data-testid="mode-tabs">
            <button
              type="button"
              onClick={() => setTab('vision')}
              data-testid="tab-vision"
              className={`px-5 py-2 font-bold uppercase text-xs tracking-widest border-r-2 border-black ${
                tab === 'vision' ? 'bg-black text-white' : 'bg-white hover:bg-zinc-100'
              }`}
            >
              Image
            </button>
            <button
              type="button"
              onClick={() => setTab('audio')}
              data-testid="tab-audio"
              className={`px-5 py-2 font-bold uppercase text-xs tracking-widest ${
                tab === 'audio' ? 'bg-black text-white' : 'bg-white hover:bg-zinc-100'
              }`}
            >
              Audio
            </button>
          </div>

          {tab === 'vision' ? (
            <VisionPanel onSaved={refresh} />
          ) : (
            <TranscribePanel onSaved={refresh} />
          )}
        </section>

        <aside className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-2xl tracking-tight">History</h2>
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600" data-testid="history-count">
              {history.length} item{history.length === 1 ? '' : 's'}
            </span>
          </div>
          <HistoryList items={history} onChanged={refresh} />
        </aside>
      </main>

      <footer className="border-t-2 border-black bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
            Omni · Gemma Vision · Whisper-1 · Emergent Auth
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
            v1.0 · iOS app available
          </p>
        </div>
      </footer>
    </div>
  );
}
