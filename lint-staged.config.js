module.exports = {
  "*": "pnpm exec oxfmt --no-error-on-unmatched-pattern",

  "front/**/*.{js,jsx,cjs,mjs,ts,tsx}":
    "pnpm --filter front run lint:staged --",
  "front/**/*.{ts,tsx}": () => "pnpm --filter front run type-check",

  "back/**/*.{js,jsx,cjs,mjs,ts,tsx}": "pnpm --filter back run lint:staged --",
  "back/**/*.{ts,tsx}": () => "pnpm --filter back run type-check",
}
