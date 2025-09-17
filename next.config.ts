import type { NextConfig } from "next";

const assetBase = process.env.S3_PUBLIC_URL_BASE || "";
let remotePatterns: { protocol: "http" | "https"; hostname: string; port?: string; pathname: string }[] | undefined = undefined;
try {
  if (assetBase) {
    const u = new URL(assetBase);
    const basePath = u.pathname.replace(/\/$/, "");
    const pathPattern = (basePath || "/") + (basePath.endsWith("/") ? "**" : "/**");
    remotePatterns = [{ protocol: (u.protocol.replace(":", "") as any) || "https", hostname: u.hostname, port: u.port || undefined, pathname: pathPattern }];
  }
} catch {}

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: remotePatterns ? { remotePatterns } : undefined,
};

export default nextConfig;
