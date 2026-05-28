import swc from "unplugin-swc"
import { defineConfig } from "vitest/config"

export default defineConfig({
  oxc: false,
  plugins: [
    swc.vite({
      jsc: {
        parser: {
          syntax: "typescript",
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
        target: "es2023",
      },
      module: {
        type: "es6",
      },
    }),
  ],
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts", "test/e2e/**/*.spec.ts"],
    coverage: {
      reporter: ["text"],
    },
  },
})
