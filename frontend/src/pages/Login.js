import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Mic, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { easeOut } from '../lib/motion';

export default function Login() {
  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href =
      `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-zinc-950 text-white" data-testid="login-page">
      {/* Ambient blobs */}
      <div className="blob bg-blue-700 left-[-15%] top-[-15%] h-[420px] w-[420px]" />
      <div className="blob bg-indigo-500 right-[-10%] top-[10%] h-[380px] w-[380px]" />
      <div className="blob bg-fuchsia-600 left-[20%] bottom-[-25%] h-[420px] w-[420px] opacity-30" />

      {/* Background image with heavy blur */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1663970206579-c157cba7edda?crop=entropy&cs=srgb&fm=jpg&w=1600&q=70')",
          filter: 'blur(40px)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/70 to-zinc-950" />

      {/* Top brand bar */}
      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 sm:py-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="flex items-center gap-3"
        >
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-glow">
            <span className="font-heading text-base font-bold">O</span>
            <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/20" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Omni · v1.0</span>
        </motion.div>
        <span className="hidden text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-500 sm:block">
          Multimodal AI
        </span>
      </header>

      {/* Main split */}
      <main className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-10 px-5 pb-10 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:pb-16">
        {/* Left: copy + CTA */}
        <section className="flex flex-col items-start">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut, delay: 0.1 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-zinc-300 backdrop-blur-xl"
          >
            <Sparkles size={12} className="text-blue-400" />
            Vision · Voice · Text · in one place
          </motion.div>

          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Sign in to <br />
            <span className="bg-gradient-to-br from-blue-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
              OMNI.
            </span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-400 sm:text-lg">
            See images, transcribe audio, ask anything — then share to WhatsApp in one tap.
            Your multimodal AI workspace, on web and iOS.
          </p>

          {/* Feature row */}
          <div className="mt-7 grid w-full max-w-md grid-cols-3 gap-3">
            <FeaturePill icon={<ImageIcon size={14} />} label="Vision" />
            <FeaturePill icon={<Mic size={14} />} label="Whisper" />
            <FeaturePill icon={<MessageSquare size={14} />} label="Chat" />
          </div>

          <motion.button
            onClick={handleLogin}
            data-testid="login-google-button"
            initial={false}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group relative mt-8 flex w-full max-w-md items-center justify-between overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] px-6 py-4 text-sm font-semibold text-white backdrop-blur-xl transition-colors hover:bg-white/[0.10]"
          >
            <span className="pointer-events-none absolute inset-y-0 -left-12 w-12 -skew-x-12 bg-white/10 opacity-0 transition-all duration-700 group-hover:left-[105%] group-hover:opacity-100" />
            <span className="flex items-center gap-3">
              <GoogleGlyph />
              Continue with Google
            </span>
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </motion.button>

          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
            Powered by Emergent Auth · 7-day sessions
          </p>
        </section>

        {/* Right: preview */}
        <section className="hidden items-center justify-center lg:flex">
          <PreviewCard />
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 pb-5 text-[11px] text-zinc-500 sm:px-8 sm:pb-6">
        <span>© Omni AI · {new Date().getFullYear()}</span>
        <span className="hidden font-mono uppercase tracking-[0.18em] sm:inline">Built with care</span>
      </footer>
    </div>
  );
}

function FeaturePill({ icon, label }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-200 backdrop-blur-xl">
      <span className="text-blue-300">{icon}</span>
      {label}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.5 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.6-8 19.6-20 0-1.2-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.3l-6.2-5.2C29.1 35 26.7 36 24 36c-5.2 0-9.5-3.3-11.2-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.3 4.4-4.3 5.8l6.2 5.2C40.9 36 44 30.5 44 24c0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function PreviewCard() {
  return (
    <div className="relative">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-[380px] overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 shadow-lift backdrop-blur-2xl xl:w-[440px]"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
            omni / session
          </div>
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>
        </div>
        <div className="space-y-3 p-6 font-mono text-xs leading-relaxed text-zinc-300">
          <Line tag="vision">analyse_image(<span className="text-blue-300">"./cat.jpg"</span>)</Line>
          <Line tag="→" muted>orange tabby · sitting · soft daylight</Line>
          <Line tag="audio">transcribe(<span className="text-rose-300">"./voice.mp3"</span>)</Line>
          <Line tag="→" muted>"meeting starts at 5pm sharp"</Line>
          <Line tag="share">share_whatsapp(result)</Line>
          <Line tag="✓" success>shared.</Line>
        </div>
        <div className="border-t border-white/10 bg-black/30 px-5 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="font-mono uppercase tracking-[0.2em]">omni cli</span>
            <span>connected</span>
          </div>
        </div>
      </motion.div>
      <div className="absolute -inset-10 -z-10 rounded-[40px] bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-fuchsia-500/20 blur-2xl" />
    </div>
  );
}

function Line({ tag, children, muted, success }) {
  return (
    <div className="flex gap-3">
      <span className={`min-w-[60px] uppercase tracking-[0.18em] ${success ? 'text-emerald-400' : 'text-zinc-500'}`}>
        {tag}
      </span>
      <span className={muted ? 'text-zinc-500' : 'text-zinc-200'}>{children}</span>
    </div>
  );
}
