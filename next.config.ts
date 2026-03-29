import type { NextConfig } from "next";

/** Static export: no serverless APIs—PDF is built in the browser. Simpler on Vercel/GitHub Pages. */
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
