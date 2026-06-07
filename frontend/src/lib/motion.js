// Centralized framer-motion variants per design guidelines
export const easeOut = [0.16, 1, 0.3, 1];

export const pageEntrance = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25, ease: easeOut } },
};

export const stagger = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

export const popIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: easeOut } },
};

export const cardHover = {
  whileHover: { y: -3, transition: { duration: 0.2, ease: easeOut } },
};

export const micPulse = {
  scale: [1, 1.08, 1],
  boxShadow: [
    '0 0 0px rgba(239,68,68,0)',
    '0 0 28px rgba(239,68,68,0.55)',
    '0 0 0px rgba(239,68,68,0)',
  ],
  transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
};

export const tap = { whileTap: { scale: 0.97 } };
