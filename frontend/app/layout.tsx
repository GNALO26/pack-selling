import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: { default: 'GUI-LOK DEV — Pack Digital 360', template: '%s | GUI-LOK DEV' },
  description: 'Guides premium pour maîtriser l\'écosystème Google et devenir consultant digital au Bénin.',
  keywords: ['Google Business Profile','SEO Bénin','Pack Digital','consultant digital Cotonou'],
  authors: [{ name: 'Olympe GUIDO-LOKOSSOU' }],
  openGraph: {
    title: 'GUI-LOK DEV — Pack Digital 360',
    description: 'De développeur web à consultant digital indispensable.',
    type: 'website', locale: 'fr_BJ',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/logo.png" />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0C1A2E',
              color: '#EEF6FF',
              borderRadius: '0',
              border: '1px solid rgba(0,212,255,0.2)',
              fontSize: '13px',
              fontFamily: 'Orbitron, monospace',
              letterSpacing: '0.05em',
              clipPath: 'polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)',
            },
            success: { iconTheme: { primary: '#00D4FF', secondary: '#020608' } },
            error:   { iconTheme: { primary: '#FF006E', secondary: '#020608' } },
          }}
        />
      </body>
    </html>
  );
}
