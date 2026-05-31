/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/app-build-manifest\.json$/, /_redirects$/],
  publicExcludes: ['!notification.mp3', '!_redirects'],
});

const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Resolve shared directory modules from this app's node_modules
  webpack: (config) => {
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      ...config.resolve.modules || [],
    ];
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
  },
  async rewrites() {
    return [
      {
        source: '/admin/:path*',
        destination: '/admin/:path*',
      },
    ];
  },
  // Disable static page generation for pages with dynamic params
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = withPWA(nextConfig);
