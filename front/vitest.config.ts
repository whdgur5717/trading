import { resolve } from "node:path"
import react from "@vitejs/plugin-react"
import { playwright } from "@vitest/browser-playwright"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    include: ["**/*.test.*"],
    deps: {
      optimizer: {
        web: {
          include: ["culori"],
        },
      },
    },
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [
        { browser: "chromium" },
        { browser: "firefox" },
        { browser: "webkit" },
      ],
    },
  },
})
