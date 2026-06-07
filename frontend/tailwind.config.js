/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      fontFamily: {
        heading: ["'Outfit'", 'sans-serif'],
        body: ["'IBM Plex Sans'", 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
      },
      colors: {
        klein: '#002FA7',
        signal: '#FF2400',
        whats: '#25D366',
      },
      boxShadow: {
        brut: '4px 4px 0px 0px rgba(0,0,0,1)',
        brutLg: '6px 6px 0px 0px rgba(0,0,0,1)',
        brutSm: '2px 2px 0px 0px rgba(0,0,0,1)',
      },
    },
  },
  plugins: [],
};
