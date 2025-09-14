import type { NextConfig } from "next";

const assetBase = process.env.S3_PUBLIC_URL_BASE || "";
let imageDomains: string[] = [];
try {
  if (assetBase) {
    const u = new URL(assetBase);
    imageDomains.push(u.hostname);
  }
} catch {}

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: imageDomains.length
    ? { domains: imageDomains }
    : undefined,
};

export default nextConfig;
