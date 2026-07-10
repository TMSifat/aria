import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Native / heavy server-only packages should not be bundled by Next.
  serverExternalPackages: [
    'bcrypt',
    '@prisma/client',
    '@anthropic-ai/sdk',
    '@google/genai',
  ],
  eslint: {
    // Lint is run separately; don't block production builds on it.
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
