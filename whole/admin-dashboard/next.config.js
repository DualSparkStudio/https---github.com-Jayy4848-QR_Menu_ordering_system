/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    missingSuspenseWithCSRBailout: true,
  },
};

module.exports = nextConfig;
