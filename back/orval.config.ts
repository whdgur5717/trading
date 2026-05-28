import { defineConfig } from "orval"

export default defineConfig({
  petstore: {
    output: {
      client: "zod",
      mode: "single",
      target: "./src/api/schemas",
    },
    input: {
      target: "./docs/openapi.json",
    },
  },
})
