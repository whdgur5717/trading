import eslint from "@eslint/js"
import prettierConfig from "eslint-config-prettier"
import globals from "globals"

export default [
  {
    ignores: ["node_modules/**"],
  },
  eslint.configs.recommended,
  prettierConfig,
  {
    files: ["**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      "no-void": "error",
    },
  },
]
