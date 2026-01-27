/**
 * Next.js 설정
 * 보안: 보안 헤더 설정
 * DX/배포: 빌드 최적화 설정
 */

import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // 메모리 최적화
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // 투두리스트 위젯 iframe 임베드 허용
        source: '/todo-widget/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL', // iframe 임베드 허용
          },
          ...securityHeaders.filter(h => h.key !== 'X-Frame-Options'),
        ],
      },
    ];
  },
  
  
  images: {
    domains: ['notion.so', 'www.notion.so'],
  },
  
  poweredByHeader: false,
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

export default nextConfig;
