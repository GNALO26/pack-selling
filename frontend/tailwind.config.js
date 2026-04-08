/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}','./styles/**/*.css'],
  safelist: [
    {pattern:/^(bg|text|border|from|to|via|ring|fill|stroke)-(cyan|magenta|purple|gold|green)$/},
    'badge-cyan','badge-magenta','badge-green','badge-gold','badge-grey','badge-purple',
    'btn-primary','btn-magenta','btn-outline','btn-ghost',
    'card','card-cyber','glass','grid-bg','corners',
    'text-cyan-glow','text-mag-glow','text-holo','cyber-line','scan-overlay',
    'anim-fade','anim-up','anim-in','anim-float','anim-pulse-c','anim-pulse-m','anim-rot','anim-blink',
    {pattern:/^d[1-6]$/},
    'page-header',
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          cyan: '#00D4FF', magenta: '#FF006E', purple: '#8B5CF6',
          gold: '#FFB800', green: '#00FF88',
          void: '#020608', deep: '#060D1A', dark: '#0A1628',
          card: '#0C1A2E', panel: '#0F2040',
        },
      },
      fontFamily: {
        display: ['Orbitron','monospace'],
        body:    ['Rajdhani','system-ui','sans-serif'],
        mono:    ['JetBrains Mono','monospace'],
      },
      animation: {
        'fade':       'fadeIn .6s ease-out both',
        'slide-up':   'slideUp .6s ease-out both',
        'pulse-cyan': 'pulseCyan 3s ease-in-out infinite',
        'pulse-mag':  'pulseMag 3s ease-in-out infinite',
        'rot-slow':   'rotSlow 22s linear infinite',
        'float':      'float 4s ease-in-out infinite',
        'scan':       'scan 5s linear infinite',
        'shimmer':    'shimmer 2.5s linear infinite',
      },
      keyframes: {
        fadeIn:    {from:{opacity:'0'},to:{opacity:'1'}},
        slideUp:   {from:{opacity:'0',transform:'translateY(28px)'},to:{opacity:'1',transform:'translateY(0)'}},
        pulseCyan: {'0%,100%':{boxShadow:'0 0 8px rgba(0,212,255,0.3)'},'50%':{boxShadow:'0 0 28px rgba(0,212,255,0.7)'}},
        pulseMag:  {'0%,100%':{boxShadow:'0 0 8px rgba(255,0,110,0.3)'},  '50%':{boxShadow:'0 0 28px rgba(255,0,110,0.7)'}},
        rotSlow:   {from:{transform:'rotate(0deg)'},to:{transform:'rotate(360deg)'}},
        float:     {'0%,100%':{transform:'translateY(0)'},'50%':{transform:'translateY(-8px)'}},
        scan:      {'0%':{transform:'translateY(-100%)'},'100%':{transform:'translateY(100vh)'}},
        shimmer:   {'0%':{backgroundPosition:'-200% 0'},'100%':{backgroundPosition:'200% 0'}},
      },
      backgroundImage: {
        'grid-cyber':   "linear-gradient(rgba(0,212,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,.025) 1px,transparent 1px)",
        'cyber-dark':   'linear-gradient(135deg,#020608 0%,#060D1A 60%,#0A1628 100%)',
        'holo':         'linear-gradient(135deg,#00D4FF,#8B5CF6,#FF006E)',
        'cyan-grad':    'linear-gradient(135deg,#00D4FF,#0099BB)',
        'mag-grad':     'linear-gradient(135deg,#FF006E,#BB004F)',
      },
      boxShadow: {
        'cyan':      '0 0 20px rgba(0,212,255,0.4),0 0 60px rgba(0,212,255,0.12)',
        'mag':       '0 0 20px rgba(255,0,110,0.4),0 0 60px rgba(255,0,110,0.12)',
        'card':      '0 8px 40px rgba(0,0,0,0.7),0 1px 0 rgba(255,255,255,0.04)',
        'card-hover':'0 16px 56px rgba(0,0,0,0.85),0 0 40px rgba(0,212,255,0.07)',
      },
    },
  },
  plugins: [],
};
