/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // output: 'standalone',
  // trailingSlash: true, // 移除以避免API路由重定向问题
  images: {
    unoptimized: true,
  },
};

module.exports = {
  ...nextConfig,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    return config;
  },
};
