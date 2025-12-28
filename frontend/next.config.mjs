/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable webpack polling for better file watching in Docker (dev only)
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/node_modules", "**/.git", "**/.next"],
      };
    }
    return config;
  },
  async rewrites() {
    // Use environment variable for backend URL, fallback to local Docker setup
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.BACKEND_URL ||
      "http://c455_backend:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      { source: "/health", destination: `${backendUrl}/health` },
    ];
  },
};
export default nextConfig;
