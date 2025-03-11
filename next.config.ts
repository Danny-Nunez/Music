import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/mobile/proxy/:path*',
          destination: '/api/mobile/:path*',
        },
        {
          source: '/api/auth/mobile/proxy/:path*',
          destination: '/api/auth/mobile/:path*',
        }
      ],
      afterFiles: [],
      fallback: []
    };
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't include these packages on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        http: false,
        https: false,
        stream: false,
        crypto: false,
        os: false,
        url: false,
        assert: false,
        util: false,
        zlib: false,
      };
    }
    return config;
  },
  // Configure serverless function settings for Puppeteer
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Increase serverless function timeout and memory for Puppeteer operations
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
  },
  // Allow images from external domains
  images: {
    domains: ['lh3.googleusercontent.com', 'i.ytimg.com', 'www.youtube.com', 'img.youtube.com'], // Added YouTube domain
  },
  // Allow YouTube as a video source
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://www.youtube.com",
          },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Session-Token' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Session-Token' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ];
  },
};

export default nextConfig;
