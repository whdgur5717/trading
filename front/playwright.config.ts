import { defineConfig } from "next/experimental/testmode/playwright"

export default defineConfig({
  testMatch: "**/*.e2e.ts",
  use: {
    baseURL: "http://localhost:3000",
    nextOptions: {
      fetchLoopback: true,
    },
  },
  webServer: [
    {
      command: "pnpm --filter back start:dev",
      url: "http://127.0.0.1:4000/health",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm dev",
      url: "http://localhost:3000",
      env: {
        API_BASE_URL: "http://127.0.0.1:4000",
        APP_ORIGIN: "http://localhost:3000",
        PLAYWRIGHT_TEST: "true",
      },
    },
  ],
})
