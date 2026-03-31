/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // output: 'standalone',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
