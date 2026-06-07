/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      fontFamily: {
        heading: ["'Outfit'", 'sans-serif'],
        body: ["'Manrope'", 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
      },
      colors: {
        whats: '#25D366',
      },
      backdropBlur: { '3xl': '64px' },
      boxShadow: {
        glow: '0 0 24px rgba(59,130,246,0.35)',
        glowSoft: '0 0 18px rgba(255,255,255,0.05)',
        recording: '0 0 24px rgba(239,68,68,0.55)',
        lift: '0 20px 50px rgba(0,0,0,0.55)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        floatslow: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.4s linear infinite',
        floatslow: 'floatslow 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
