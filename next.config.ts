import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mock browser APIs on server
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh5.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'streetviewpixels-pa.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh4.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh6.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'gps-proxy.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'gps-cs-s.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
  },
};

export default nextConfig;
