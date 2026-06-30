import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import Handlebars from "handlebars"
import { readOpenApiDocument } from "./openapi-document.mjs"
import { buildClientModel } from "./openapi-model.mjs"

const FRONT_PACKAGE_NAME = "front"
const FRONT_PACKAGE_DIR = "front"
const FRONT_OUTPUT_DIR = "src/queries/generated"
const FRONT_TEMPLATES_DIR = "templates/front"

async function assertFrontPackage(frontRoot) {
  const packageJson = JSON.parse(
    await readFile(resolve(frontRoot, "package.json"), "utf8")
  )

  if (packageJson.name !== FRONT_PACKAGE_NAME) {
    throw new Error(
      `api-client generate front requires a ${FRONT_PACKAGE_NAME} package.`
    )
  }
}

async function renderTemplate({
  context,
  outputPath,
  packageRoot,
  templateName,
}) {
  const templatePath = resolve(packageRoot, FRONT_TEMPLATES_DIR, templateName)
  const template = Handlebars.compile(await readFile(templatePath, "utf8"), {
    noEscape: true,
  })

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, template(context))
}

export async function renderFrontClient({ packageRoot, workspaceRoot }) {
  const frontRoot = resolve(workspaceRoot, FRONT_PACKAGE_DIR)

  await assertFrontPackage(frontRoot)

  const document = await readOpenApiDocument(packageRoot)
  const model = buildClientModel(document)
  const outputDir = resolve(frontRoot, FRONT_OUTPUT_DIR)

  await rm(outputDir, { recursive: true, force: true })
  await mkdir(outputDir, { recursive: true })

  await renderTemplate({
    packageRoot,
    templateName: "schemas.hbs",
    context: { schemas: model.schemas },
    outputPath: resolve(outputDir, "schemas.ts"),
  })

  for (const tag of model.tags) {
    await renderTemplate({
      packageRoot,
      templateName: "client.hbs",
      context: tag,
      outputPath: resolve(outputDir, `${tag.fileName}.ts`),
    })
  }

  await renderTemplate({
    packageRoot,
    templateName: "index.hbs",
    context: { exports: model.exports },
    outputPath: resolve(outputDir, "index.ts"),
  })
}
