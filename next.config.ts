import type { NextConfig } from "next";

/**
 * Default Next.js output (no `output: "export"`). The app has no API routes;
 * pages are still static. Vercel’s Next preset serves `.next` correctly—using
 * only `out/` often led to NOT_FOUND at the edge.
 */
const nextConfig: NextConfig = {};

export default nextConfig;
