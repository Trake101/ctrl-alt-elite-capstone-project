import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Set empty turbopack config to silence warning while using webpack
  // We use webpack for better Docker file watching support
  turbopack: {},
  // Allow external images from gravatar
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
        pathname: '/avatar/**',
      },
    ],
  },
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
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/node_modules", "**/.git", "**/.next"],
        followSymlinks: false,
      };
    }

    return config;
  },
  async rewrites() {
    // Note: API routes in /app/api/[...path]/route.ts handle /api/* requests at runtime
    // This rewrites function is kept for the /health endpoint only
    // For local Docker development, we can still use rewrites as a fallback
    const isProduction = process.env.NODE_ENV === "production";
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
      process.env.BACKEND_URL?.trim() ||
      (isProduction ? null : "http://c455_backend:8000");

    // Only set up rewrites for health endpoint or if we have a backend URL in dev
    if (!backendUrl) {
      return [];
    }

    const cleanBackendUrl = backendUrl.replace(/\/$/, "");

    return [
      // Health endpoint rewrite (API routes handle /api/* at runtime)
      { source: "/health", destination: `${cleanBackendUrl}/health` },
    ];
  },
};
export default nextConfig;
