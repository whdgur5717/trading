import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare"
import type { NextConfig } from "next"

initOpenNextCloudflareForDev()

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    testProxy: process.env.PLAYWRIGHT_TEST === "true",
  },
}

export default nextConfig
