import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        onix: '#08070D',
        violeta: '#B45CFF',
        magenta: '#E07BC0',
        noche: '#160F26',
        berenjena: '#2A1840',
        niebla: '#6A5F80',
        lila: '#DCB6FF',
        hueso: '#F2F0F5',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #B45CFF, #E07BC0)',
        'brand-glow': 'radial-gradient(circle, rgba(178,80,255,0.5), transparent 70%)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
