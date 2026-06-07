import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { easeOut } from '../lib/motion';

export default function Login() {
  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href =
      `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-zinc-950 text-white" data-testid="login-page">
      {/* Ambient blobs */}
      <div className="blob bg-blue-700 left-[-15%] top-[-10%] h-[480px] w-[480px]" />
      <div className="blob bg-indigo-500 right-[-10%] top-[20%] h-[420px] w-[420px]" />
      <div className="blob bg-fuchsia-600 left-[35%] bottom-[-20%] h-[420px] w-[420px] opacity-30" />
      <div className="bg-grain relative" />

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

      {/* Content */}
      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left: form */}
        <div className="flex flex-col justify-between p-10 md:p-16">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="flex items-center gap-3"
          >
            <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-glow">
              <span className="font-heading text-lg font-bold">O</span>
              <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/20" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Omni · v1.0</span>
          </motion.div>

          <div className="max-w-md">
            <motion.div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 backdrop-blur-xl"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut, delay: 0.15 }}
            >
              <Sparkles size={12} className="text-blue-400" />
              Multimodal AI · Vision · Voice · Text
            </motion.div>
            <h1 className="font-heading text-5xl font-semibold tracking-tight md:text-6xl">
              Sign in to <br />
              <span className="bg-gradient-to-br from-blue-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
                OMNI.
              </span>
            </h1>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-zinc-400">
              See images, transcribe audio, ask anything. Sign in to start your
              multimodal workspace — and share any result to WhatsApp in one tap.
            </p>

            <motion.button
              onClick={handleLogin}
              data-testid="login-google-button"
              initial={false}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group relative mt-10 flex w-full items-center justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-white backdrop-blur-xl transition-colors hover:bg-white/[0.08]"
            >
              <span className="absolute inset-y-0 -left-12 w-12 -skew-x-12 bg-white/10 opacity-0 transition-all duration-700 group-hover:left-[105%] group-hover:opacity-100" />
              <span className="flex items-center gap-3">
                <GoogleGlyph />
                Continue with Google
              </span>
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </motion.button>

            <p className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              Powered by Emergent Auth · 7-day sessions
            </p>
          </div>

          <div className="text-xs font-medium text-zinc-500">
            © Omni AI · {new Date().getFullYear()}
          </div>
        </div>

        {/* Right: visual */}
        <motion.div
          className="relative hidden items-center justify-center lg:flex"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: easeOut, delay: 0.1 }}
        >
          <PreviewCard />
        </motion.div>
      </div>
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
        className="relative h-[460px] w-[420px] overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 shadow-lift backdrop-blur-2xl"
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
          <Line tag="→" muted>
            orange tabby · sitting · soft daylight
          </Line>
          <Line tag="audio">transcribe(<span className="text-rose-300">"./voice.mp3"</span>)</Line>
          <Line tag="→" muted>"meeting starts at 5pm sharp"</Line>
          <Line tag="share">share_whatsapp(result)</Line>
          <Line tag="✓" success>shared.</Line>
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/30 px-5 py-3 backdrop-blur-xl">
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
      <span className={`min-w-[64px] uppercase tracking-[0.18em] ${success ? 'text-emerald-400' : 'text-zinc-500'}`}>
        {tag}
      </span>
      <span className={muted ? 'text-zinc-500' : 'text-zinc-200'}>{children}</span>
    </div>
  );
}
