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
    // Use environment variable for backend URL
    // In Railway, NEXT_PUBLIC_BACKEND_URL should be set to the public backend URL
    // For local Docker development, fallback to container name
    const isProduction = process.env.NODE_ENV === "production";

    // Check all possible environment variable names
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
      process.env.BACKEND_URL?.trim() ||
      (isProduction ? null : "http://c455_backend:8000");

    // Log environment variable status (helpful for debugging)
    console.log(`[Next.js Config] NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(
      `[Next.js Config] NEXT_PUBLIC_BACKEND_URL: ${
        process.env.NEXT_PUBLIC_BACKEND_URL || "NOT SET"
      }`
    );
    console.log(
      `[Next.js Config] BACKEND_URL: ${process.env.BACKEND_URL || "NOT SET"}`
    );
    console.log(
      `[Next.js Config] Resolved Backend URL: ${backendUrl || "NOT SET"}`
    );

    // Ensure backendUrl doesn't end with a slash
    const cleanBackendUrl = backendUrl?.replace(/\/$/, "");

    // In production, we must have a valid backend URL
    if (isProduction) {
      if (!cleanBackendUrl) {
        console.error(
          "ERROR: NEXT_PUBLIC_BACKEND_URL is not set in production. " +
            "Please set NEXT_PUBLIC_BACKEND_URL in Railway to your backend service URL."
        );
        // Return empty rewrites - this will cause API calls to fail, but that's better than using wrong URL
        return [];
      }

      // Validate that we're not using Docker container names in production
      if (
        cleanBackendUrl.includes("c455_backend") ||
        cleanBackendUrl.startsWith("http://c455_")
      ) {
        console.error(
          "ERROR: Backend URL appears to be using Docker container name in production. " +
            `Current value: ${cleanBackendUrl}. ` +
            "Please set NEXT_PUBLIC_BACKEND_URL to your Railway backend service URL (e.g., https://your-backend.railway.app)"
        );
        return [];
      }

      // Validate URL format
      if (
        !cleanBackendUrl.startsWith("http://") &&
        !cleanBackendUrl.startsWith("https://")
      ) {
        console.error(
          `ERROR: Backend URL must start with http:// or https://. Current value: ${cleanBackendUrl}`
        );
        return [];
      }
    }

    const rewrites = [
      {
        source: "/api/:path*",
        destination: `${cleanBackendUrl}/api/:path*`,
      },
      { source: "/health", destination: `${cleanBackendUrl}/health` },
    ];

    console.log(
      `[Next.js Config] Configured rewrites:`,
      JSON.stringify(rewrites, null, 2)
    );

    return rewrites;
  },
};
export default nextConfig;
