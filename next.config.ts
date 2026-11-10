import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Load markdown topic files from disk at request time on the server.
  serverExternalPackages: ["gray-matter"],
};

export default nextConfig;
