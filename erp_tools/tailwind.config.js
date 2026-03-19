/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'xtreme-black': '#020203',
        'xtreme-panel': '#0a0c10',
        'xtreme-blue': '#0284c7',
        'xtreme-cyan': '#00e5ff',
        'xtreme-silver': '#e2e8f0',
        'xtreme-dark': '#0B1120',
        'xtreme-navy': '#1e293b',
        'xtreme-orange': '#ff6b00',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        tech: ['Exo 2', 'sans-serif'],
        hud: ['Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(0, 240, 255, 0.3), 0 0 20px rgba(0, 240, 255, 0.1)',
        'neon-blue': '0 0 15px rgba(0, 51, 204, 0.4)',
        'glass-inset': 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 20px rgba(0,0,0,0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 10s linear infinite',
        'shine': 'shine 1.5s ease-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shine: {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        }
      }
    },
  },
  plugins: [],
}

