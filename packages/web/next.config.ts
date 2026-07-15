import type { NextConfig } from 'next';
import path from 'node:path';

const monorepoRoot = path.join(process.cwd(), '..', '..');

const nextConfig: NextConfig = {
  transpilePackages: ['@komunify/shared', '@komunify/contract-client'],
  reactStrictMode: true,
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
  webpack: (config, { isServer }) => {
    if (isServer && Array.isArray(config.externals)) {
      const reactExternals: Record<string, string> = {
        react: path.join(monorepoRoot, 'node_modules/react'),
        'react/jsx-runtime': path.join(monorepoRoot, 'node_modules/react/jsx-runtime.js'),
        'react/jsx-dev-runtime': path.join(monorepoRoot, 'node_modules/react/jsx-dev-runtime.js'),
      };

      config.externals.unshift(
        (
          {
            contextInfo,
            request,
          }: { contextInfo: { issuerLayer?: string | null }; request?: string },
          callback: (error?: Error | null, result?: string) => void,
        ) => {
          const resolvedRequest = request ? reactExternals[request] : undefined;

          if (contextInfo.issuerLayer !== 'pages-dir-node' || !resolvedRequest) {
            return callback();
          }

          return callback(null, `commonjs ${resolvedRequest}`);
        },
      );
    }

    return config;
  },
};

if (process.env.STATIC_EXPORT) {
  nextConfig.output = 'export';
  nextConfig.images = { unoptimized: true };
  if (process.env.BASE_PATH) {
    nextConfig.basePath = process.env.BASE_PATH;
  }
}

export default nextConfig;
