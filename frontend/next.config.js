/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Headers de sécurité globaux
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval requis par PDF.js
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "connect-src 'self' " + (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'),
              "frame-ancestors 'none'",  // Empêche l'embedding
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
      // Headers spéciaux pour la page viewer
      {
        source: '/(protected)/viewer(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, private' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
    ];
  },

  // Webpack pour PDF.js
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },

  images: {
    domains: [],
  },
};

module.exports = nextConfig;
