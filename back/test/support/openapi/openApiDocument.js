import { readFile } from "node:fs/promises"

const openApiUrl = new URL(
  "../../../../packages/api-client/openapi.json",
  import.meta.url
)

export async function readOpenApiDocument() {
  return JSON.parse(await readFile(openApiUrl, "utf8"))
}
