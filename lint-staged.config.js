module.exports = {
  "*": "pnpm exec prettier --write --ignore-path .prettierignore --ignore-unknown",

  "front/**/*.{js,jsx,cjs,mjs,ts,tsx}":
    "pnpm --filter front run lint:staged --",
  "front/**/*.{ts,tsx}": () => "pnpm --filter front run type-check",

  "back/**/*.{js,jsx,cjs,mjs,ts,tsx}": "pnpm --filter back run lint:staged --",
  "back/**/*.{ts,tsx}": () => "pnpm --filter back run type-check",
}
