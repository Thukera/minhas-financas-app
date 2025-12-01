/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9090',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.0.60',
        port: '9090',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;