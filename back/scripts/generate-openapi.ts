import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { NestFactory } from "@nestjs/core"
import type { NestExpressApplication } from "@nestjs/platform-express"
import { format } from "prettier"
import { AppModule } from "../src/app.module"
import { configureApp } from "../src/bootstrap/app-bootstrap"
import { createSwaggerDocument } from "../src/bootstrap/swagger"

const DEFAULT_OUTPUT_PATH = "../packages/api-client/openapi.json"

async function main(): Promise<void> {
  const outputPath = resolve(
    process.cwd(),
    process.argv[2] ?? DEFAULT_OUTPUT_PATH
  )
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: false,
  })

  try {
    configureApp(app)

    const document = createSwaggerDocument(app)
    const content = await format(JSON.stringify(document), { parser: "json" })
    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, content)
  } finally {
    await app.close()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
