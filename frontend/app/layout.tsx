import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Pack Digital 360 — Votre présence Google maîtrisée',
    template: '%s | Pack Digital 360',
  },
  description: 'Le guide complet pour maîtriser l\'écosystème Google et devenir un consultant digital indispensable au Bénin.',
  keywords: ['Google Business Profile', 'SEO Bénin', 'Pack Digital', 'consultant digital Cotonou', 'Google Analytics Bénin'],
  authors: [{ name: 'Olympe GUIDO-LOKOSSOU' }],
  openGraph: {
    title: 'Pack Digital 360 — Votre présence Google maîtrisée',
    description: 'De développeur web à consultant digital indispensable. Guide complet + Script marketing.',
    type: 'website',
    locale: 'fr_BJ',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* Preconnect Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Favicon placeholder */}
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0A1628',
              color: '#ffffff',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '14px',
              fontFamily: 'DM Sans, sans-serif',
            },
            success: {
              iconTheme: { primary: '#F9A825', secondary: '#0A1628' },
            },
            error: {
              iconTheme: { primary: '#fc8181', secondary: '#0A1628' },
            },
          }}
        />
      </body>
    </html>
  );
}
