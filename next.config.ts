import type { NextConfig } from "next";

const backendOrigin = (process.env.SJQD_BACKEND_ORIGIN || "http://127.0.0.1:5000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `${backendOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;
