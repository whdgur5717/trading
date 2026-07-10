import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { NestFactory } from "@nestjs/core"

const outputPath = resolve(
  process.cwd(),
  process.argv[2] ?? "../packages/api-client/openapi.json"
)
const { AppModule } = await import("../dist/app.module.js")
const { configureApp } = await import("../dist/bootstrap/app-bootstrap.js")
const { createOpenApiDocument } = await import("../openapi/document.mjs")
const app = await NestFactory.create(AppModule, { logger: false })

try {
  configureApp(app)

  const document = createOpenApiDocument(app)

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`)
} finally {
  await app.close()
}
