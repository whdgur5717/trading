import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import betterTailwindcss from "eslint-plugin-better-tailwindcss"
import checkFile from "eslint-plugin-check-file"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "node_modules/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "no-void": "error",
    },
  },
  {
    files: ["**/*.{js,jsx,cjs,mjs,ts,tsx}"],
    plugins: {
      "check-file": checkFile,
    },
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        {
          "**/*": "!([A-Z]*)",
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],
      "check-file/folder-naming-convention": [
        "error",
        {
          "**/": "!([A-Z]*)",
        },
      ],
    },
  },
  {
    ...betterTailwindcss.configs.recommended,
    files: ["**/*.{js,jsx,cjs,mjs,ts,tsx}"],
    settings: {
      "better-tailwindcss": {
        entryPoint: "./src/app/globals.css",
      },
    },
    rules: {
      ...betterTailwindcss.configs.recommended.rules,
      "better-tailwindcss/enforce-consistent-line-wrapping": "off",
    },
  },
])

export default eslintConfig
