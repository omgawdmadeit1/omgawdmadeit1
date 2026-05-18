import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#080b16',
        foreground: '#f8fafc',
        muted: '#94a3b8',
        card: 'rgba(15, 23, 42, 0.74)'
      },
      boxShadow: { glow: '0 0 60px rgba(14, 165, 233, 0.22)' }
    }
  },
  plugins: []
};
export default config;
