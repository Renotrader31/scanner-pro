/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Ensure CSS is properly handled
  webpack: (config) => {
    return config;
  },
}

module.exports = nextConfig