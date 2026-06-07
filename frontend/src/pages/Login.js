import React from 'react';
import { GoogleLogo, ArrowRight } from '@phosphor-icons/react';

export default function Login() {
  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href =
      `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="h-screen w-screen flex bg-white" data-testid="login-page">
      {/* Left pane - form */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-10 md:p-16 border-r-0 md:border-r-2 border-black">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black flex items-center justify-center">
            <span className="text-white font-heading font-black text-xl tracking-tighter">O</span>
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-600">OMNI · v1.0</span>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-600 mb-4">
            Multimodal AI · Vision · Voice · Text
          </p>
          <h1 className="font-heading text-6xl md:text-7xl font-black tracking-tighter leading-none mb-6">
            OMNI<span className="text-klein">.</span>
          </h1>
          <p className="font-body text-lg text-zinc-700 mb-10 leading-relaxed">
            See images, transcribe audio, ask anything. Sign in to start your
            multimodal workspace and share results to WhatsApp in one tap.
          </p>

          <button
            onClick={handleLogin}
            data-testid="login-google-button"
            className="btn-press group bg-black text-white border-2 border-black px-6 py-4 font-bold uppercase tracking-wide flex items-center justify-between gap-4 shadow-brut hover:shadow-brutSm hover:translate-x-[2px] hover:translate-y-[2px] w-full"
          >
            <span className="flex items-center gap-3">
              <GoogleLogo size={22} weight="bold" />
              Continue with Google
            </span>
            <ArrowRight size={22} weight="bold" className="group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="mt-6 text-xs font-mono uppercase tracking-widest text-zinc-500">
            Powered by Emergent Auth · Sessions expire in 7 days
          </p>
        </div>

        <div className="text-xs font-mono uppercase tracking-widest text-zinc-500 flex justify-between">
          <span>© Omni AI</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </div>

      {/* Right pane - visual */}
      <div className="hidden md:flex w-1/2 bg-zinc-50 bg-grid relative items-center justify-center overflow-hidden">
        <div className="absolute top-10 right-10 text-right">
          <p className="font-mono uppercase tracking-widest text-xs text-zinc-600">SYSTEM</p>
          <p className="font-mono uppercase tracking-widest text-xs text-zinc-600">STATUS · ONLINE</p>
        </div>
        <div className="relative w-[420px] h-[420px]">
          <div className="absolute inset-0 border-2 border-black bg-white shadow-brutLg flex flex-col">
            <div className="p-3 border-b-2 border-black bg-zinc-100 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest">OMNI/SESSION</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-signal" />
                <div className="w-2 h-2 bg-klein" />
                <div className="w-2 h-2 bg-black" />
              </div>
            </div>
            <div className="flex-1 p-5 font-mono text-xs leading-loose text-zinc-700">
              <p>{'>'} hello, omni</p>
              <p>{'>'} analyse_image(<span className="text-klein">"./cat.jpg"</span>)</p>
              <p className="text-zinc-400">  → orange tabby, looking left</p>
              <p>{'>'} transcribe(<span className="text-signal">"./voice.mp3"</span>)</p>
              <p className="text-zinc-400">  → "meeting starts at 5pm"</p>
              <p>{'>'} share_whatsapp(result)</p>
              <p className="text-whats">  ✓ shared.</p>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 border-2 border-black bg-klein" />
          <div className="absolute -top-6 -left-6 w-20 h-20 border-2 border-black bg-signal" />
        </div>
      </div>
    </div>
  );
}
