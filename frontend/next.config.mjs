/** @type {import('next').NextConfig} */
const nextConfig = {
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
