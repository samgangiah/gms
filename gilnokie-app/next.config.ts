import type { NextConfig } from "next";
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true, // Skip linting in production build
  },
  typescript: {
    ignoreBuildErrors: true, // Skip TypeScript errors in production build
  },
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  workboxOptions: {
    disableDevLogs: true,
  },
})(nextConfig);
