/** @type {import('next').NextConfig} */
const nextConfig = {
  // Serve public/index.html at root
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/index.html',
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Previne clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Previne MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Força HTTPS
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Referrer seguro
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions Policy
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          // CSP — permite Leaflet, fonts e nominatim
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://unpkg.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://unpkg.com",
              "connect-src 'self' https://nominatim.openstreetmap.org",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
      // API routes não precisam de CSP rígido
      {
        source: '/api/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
