import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { constantCase, groupBy, pascalCase, sortBy, uniq } from "es-toolkit"
import Handlebars from "handlebars"
import { getTypeScriptType, getZodType } from "./getZodType.mjs"

const OPENAPI_PATH = "docs/openapi.json"
const OUTPUT_DIR = "../front/src/queries/generated"
const TEMPLATES_DIR = "scripts/openapi-client/templates"
const METHODS = ["get", "post", "put", "patch", "delete"]
const object = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {}
const propertyKey = (name) =>
  /^[A-Za-z_$][\w$]*$/.test(name) ? name : JSON.stringify(name)

function pathExpression(path, keepLeadingSlash) {
  const normalized = keepLeadingSlash ? path : path.replace(/^\//, "")
  const parts = normalized.split(/(\{[^}]+})/g).filter(Boolean)

  if (!parts.some((part) => part[0] === "{" && part[part.length - 1] === "}")) {
    return JSON.stringify(normalized)
  }

  return `\`${parts
    .map((part) =>
      part[0] === "{" && part[part.length - 1] === "}"
        ? `\${encodeURIComponent(String(params.${part.slice(1, -1)}))}`
        : part
    )
    .join("")}\``
}

function example(schemaValue) {
  const schema = object(schemaValue)

  if ("example" in schema) {
    return schema.example
  }
  if ("const" in schema) {
    return schema.const
  }
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum[0]
  }
  if (typeof schema.$ref === "string") {
    return undefined
  }

  switch (schema.type) {
    case "string":
      return ""
    case "integer":
    case "number":
      return 0
    case "boolean":
      return true
    case "array":
      return [example(schema.items)]
    case "object":
      return Object.fromEntries(
        Object.entries(object(schema.properties)).map(([name, value]) => [
          name,
          example(value),
        ])
      )
    default:
      return undefined
  }
}

function codeLiteral(value, indent = 0) {
  if (Array.isArray(value)) {
    return value.length === 0
      ? "[]"
      : `[\n${value
          .map(
            (item) =>
              `${" ".repeat(indent + 2)}${codeLiteral(item, indent + 2)}`
          )
          .join(",\n")}\n${" ".repeat(indent)}]`
  }

  if (object(value) === value) {
    const entries = Object.entries(value)

    return entries.length === 0
      ? "{}"
      : `{\n${entries
          .map(
            ([key, entryValue]) =>
              `${" ".repeat(indent + 2)}${propertyKey(key)}: ${codeLiteral(
                entryValue,
                indent + 2
              )}`
          )
          .join(",\n")}\n${" ".repeat(indent)}}`
  }

  return JSON.stringify(value)
}

function responseZod(schema) {
  const allOf = Array.isArray(object(schema).allOf) ? object(schema).allOf : []
  const success = allOf.some(
    (item) => object(item).$ref === "#/components/schemas/ApiSuccessDto"
  )
  const dataContainer = allOf.find((item) => object(item).properties?.data)
  const dataSchema = object(dataContainer).properties?.data

  return success && dataSchema
    ? `ApiSuccessDtoSchema.omit({ data: true }).extend({\n  data: ${getZodType(
        dataSchema
      )}\n})`
    : getZodType(schema)
}

async function render(templateName, context, outputPath) {
  const templatePath = resolve(process.cwd(), TEMPLATES_DIR, templateName)
  const template = Handlebars.compile(await readFile(templatePath, "utf8"), {
    noEscape: true,
  })

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, template(context))
}

async function main() {
  const document = JSON.parse(
    await readFile(resolve(process.cwd(), OPENAPI_PATH), "utf8")
  )
  const outputDir = resolve(process.cwd(), OUTPUT_DIR)

  const operations = Object.entries(document.paths).flatMap(
    ([path, pathItem]) =>
      METHODS.flatMap((method) => {
        const operation = pathItem[method]

        if (!operation) {
          return []
        }

        const tag = operation.tags?.[0]
        const operationId = operation.operationId

        if (!tag) {
          throw new Error(`${method.toUpperCase()} ${path} has no tag`)
        }
        if (!operationId) {
          throw new Error(`${method.toUpperCase()} ${path} has no operationId`)
        }

        const parameters = operation.parameters ?? []
        const queryParams = parameters.filter(
          (parameter) => parameter.in === "query"
        )
        const pathParams = parameters.filter(
          (parameter) => parameter.in === "path"
        )
        const bodySchema =
          operation.requestBody?.content?.["application/json"]?.schema
        const eventStream =
          operation.responses?.["200"]?.content?.["text/event-stream"]
        const isSse = Boolean(eventStream)
        const functionName = constantCase(operationId)
        const exampleParams = Object.fromEntries(
          parameters.map((parameter) => [
            parameter.name,
            example(parameter.schema),
          ])
        )

        if (bodySchema) {
          exampleParams.body = example(bodySchema)
        }

        const call =
          Object.keys(exampleParams).length === 0
            ? `${functionName}()`
            : `${functionName}(${codeLiteral(exampleParams)})`
        const paramsTypeExpression = `{\n${[
          ...parameters.map(
            (parameter) =>
              `  ${propertyKey(parameter.name)}${parameter.required ? "" : "?"}: ${getTypeScriptType(
                parameter.schema
              )}`
          ),
          ...(bodySchema ? [`  body: ${getTypeScriptType(bodySchema)}`] : []),
        ].join("\n")}\n}`

        return {
          tag,
          method,
          operationId,
          functionName,
          jsDocLines: [
            "@example",
            "```ts",
            ...(isSse ? `const eventSource = ${call}` : `await ${call}`).split(
              "\n"
            ),
            "```",
          ],
          hasParams:
            pathParams.length > 0 ||
            queryParams.length > 0 ||
            bodySchema !== undefined,
          hasResponseBody:
            isSse ||
            operation.responses?.["200"]?.content?.["application/json"]
              ?.schema !== undefined,
          paramsTypeName: `${pascalCase(operationId)}Params`,
          paramsTypeExpression,
          responseTypeName: isSse
            ? `${pascalCase(operationId)}Event`
            : `${pascalCase(operationId)}Response`,
          responseSchemaName: isSse
            ? `${pascalCase(operationId)}EventSchema`
            : `${pascalCase(operationId)}ResponseSchema`,
          pathExpression: pathExpression(path, false),
          eventSourcePathExpression: pathExpression(path, true),
          kyOptionsExpression:
            queryParams.length === 0 && !bodySchema
              ? null
              : `{\n    ${[
                  queryParams.length > 0
                    ? `searchParams: {\n${queryParams
                        .map(
                          (parameter) =>
                            `      ${propertyKey(parameter.name)}: params.${parameter.name}`
                        )
                        .join(",\n")}\n    }`
                    : null,
                  bodySchema ? "json: params.body" : null,
                ]
                  .filter(Boolean)
                  .join(",\n    ")}\n  }`,
          sseQueryLines: queryParams.map(
            (parameter) =>
              `searchParams.set(${JSON.stringify(
                parameter.name
              )}, String(params.${parameter.name}))`
          ),
          isSse,
        }
      })
  )

  const operationSchemas = operations.map((operation) => {
    const pathItem = Object.values(document.paths).find((item) =>
      Object.values(item).some(
        (candidate) => candidate?.operationId === operation.operationId
      )
    )
    const sourceOperation = Object.values(pathItem).find(
      (candidate) => candidate?.operationId === operation.operationId
    )
    const schema = operation.isSse
      ? (sourceOperation.responses?.["200"]?.content?.["text/event-stream"]
          ?.itemSchema ??
        sourceOperation.responses?.["200"]?.content?.["text/event-stream"]
          ?.schema?.items)
      : sourceOperation.responses?.["200"]?.content?.["application/json"]
          ?.schema

    return {
      schemaName: operation.responseSchemaName,
      typeName: operation.responseTypeName,
      zodExpression: operation.hasResponseBody
        ? responseZod(schema)
        : "z.void()",
    }
  })
  const tags = sortBy(
    Object.entries(
      groupBy(operations, (operation) => operation.tag.toLowerCase())
    ).map(([fileName, tagOperations]) => ({
      fileName,
      usesHttp: tagOperations.some((operation) => !operation.isSse),
      usesSse: tagOperations.some((operation) => operation.isSse),
      schemaImports: uniq(
        tagOperations.flatMap((operation) =>
          operation.isSse
            ? []
            : [
                operation.responseSchemaName,
                `type ${operation.responseTypeName}`,
              ]
        )
      ),
      schemaExports: uniq(
        tagOperations.flatMap((operation) =>
          operation.isSse ? [operation.responseSchemaName] : []
        )
      ),
      typeExports: uniq(
        tagOperations.flatMap((operation) =>
          operation.isSse ? [operation.responseTypeName] : []
        )
      ),
      operations: tagOperations,
    })),
    [(tag) => tag.fileName]
  )

  await mkdir(outputDir, { recursive: true })
  await render(
    "schemas.hbs",
    {
      schemas: [
        ...Object.entries(document.components.schemas).map(
          ([name, schema]) => ({
            schemaName: `${name}Schema`,
            typeName: name,
            zodExpression: getZodType(schema),
          })
        ),
        ...operationSchemas,
      ],
    },
    resolve(outputDir, "schemas.ts")
  )

  for (const tag of tags) {
    await render("client.hbs", tag, resolve(outputDir, `${tag.fileName}.ts`))
  }

  await render(
    "index.hbs",
    {
      exports: tags.map((tag) => tag.fileName),
    },
    resolve(outputDir, "index.ts")
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
