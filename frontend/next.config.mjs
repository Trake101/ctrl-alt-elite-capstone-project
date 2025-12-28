import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add empty turbopack config to allow webpack config
  // Next.js 16 uses Turbopack by default, but we have custom webpack config
  turbopack: {},
  // Enable webpack polling for better file watching in Docker (dev only)
  webpack: (config, { dev, isServer, webpack }) => {
    // Always set up path aliases first (before any conditional logic)
    // Use absolute path resolution to ensure it works in all environments
    const projectRoot = path.resolve(process.cwd());

    // Ensure resolve object exists
    if (!config.resolve) {
      config.resolve = {};
    }

    // Set up alias - use both absolute and relative resolution
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": projectRoot,
    };

    // Also add to modules for additional resolution paths
    if (!config.resolve.modules) {
      config.resolve.modules = [];
    }
    if (!config.resolve.modules.includes(projectRoot)) {
      config.resolve.modules = [projectRoot, ...config.resolve.modules];
    }

    // Enable webpack polling for better file watching in Docker (dev only)
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
