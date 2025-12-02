/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable webpack polling for better file watching in Docker
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      };
    }
    return config;
  },
  // Enable webpack dev middleware polling
  webpackDevMiddleware: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: ['**/node_modules', '**/.git', '**/.next'],
    };
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://c455_backend:8000/api/:path*",
      },
      { source: "/health", destination: "http://c455_backend:8000/health" },
    ];
  },
};
export default nextConfig;
