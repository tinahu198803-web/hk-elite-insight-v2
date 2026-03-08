/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // output: 'export', // 移除静态导出以支持API
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
