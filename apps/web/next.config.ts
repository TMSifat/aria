import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Native / heavy server-only packages should not be bundled by Next.
  serverExternalPackages: ['bcrypt', '@prisma/client', '@anthropic-ai/sdk'],
  eslint: {
    // Lint is run separately; don't block production builds on it.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
