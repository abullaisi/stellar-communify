import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@komunify/shared', '@komunify/contract-client'],
  reactStrictMode: true,
};

export default nextConfig;
