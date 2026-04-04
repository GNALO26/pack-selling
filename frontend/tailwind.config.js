/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A1628',
          50: '#E8EDF5',
          100: '#C5D0E6',
          200: '#8FA2CC',
          300: '#5974B2',
          400: '#2A4B98',
          500: '#0A1628',
          600: '#081220',
          700: '#060E18',
          800: '#040A10',
          900: '#020508',
        },
        gold: {
          DEFAULT: '#F9A825',
          light: '#FFFDE7',
          dark: '#E65100',
        },
        brand: {
          blue: '#1565C0',
          lblue: '#1E88E5',
          sky: '#E3F2FD',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body:    ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'fade-in':      'fadeIn 0.5s ease-out forwards',
        'slide-up':     'slideUp 0.6s ease-out forwards',
        'slide-right':  'slideRight 0.5s ease-out forwards',
        'pulse-gold':   'pulseGold 2s ease-in-out infinite',
        'shimmer':      'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideRight:{ from: { opacity: 0, transform: 'translateX(-24px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulseGold: { '0%,100%': { boxShadow: '0 0 0 0 rgba(249,168,37,0.4)' }, '50%': { boxShadow: '0 0 0 12px rgba(249,168,37,0)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      backgroundImage: {
        'navy-gradient': 'linear-gradient(135deg, #0A1628 0%, #1565C0 100%)',
        'gold-gradient': 'linear-gradient(135deg, #F9A825 0%, #E65100 100%)',
        'hero-pattern':  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'gold': '0 0 30px rgba(249, 168, 37, 0.3)',
        'navy': '0 20px 60px rgba(10, 22, 40, 0.4)',
        'card': '0 4px 24px rgba(0,0,0,0.08)',
        'card-hover': '0 12px 40px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
};
