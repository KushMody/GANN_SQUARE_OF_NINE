import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Prevents double chart mounting in dev
  experimental: {
    turbopackPluginRuntimeStrategy: "workerThreads",
  } as any,
};

export default nextConfig;
