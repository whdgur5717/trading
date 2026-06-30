import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

const object = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {}

export async function readOpenApiDocument(packageRoot) {
  const documentPath = resolve(packageRoot, "openapi.json")
  const document = JSON.parse(await readFile(documentPath, "utf8"))

  if (object(document.paths) !== document.paths) {
    throw new Error("OpenAPI document has no paths object.")
  }

  if (object(document.components?.schemas) !== document.components?.schemas) {
    throw new Error("OpenAPI document has no components.schemas object.")
  }

  return document
}
