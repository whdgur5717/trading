import { access, readFile, readdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { openapiOverlay, parseFile } from "openapi-format"
import { defineConfig, pascal } from "orval"
import { format, resolveConfig } from "prettier"
import * as zod from "zod/mini"

const openapiDirectory = dirname(fileURLToPath(import.meta.url))
const generatedDirectory = resolve(openapiDirectory, "..", "generated")
const prettierConfig = (await resolveConfig(openapiDirectory)) ?? {}
const methods = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
]
const componentSchemaReference = zod.strictObject({
  $ref: zod
    .string()
    .check(
      zod.startsWith("#/components/schemas/"),
      zod.minLength("#/components/schemas/".length + 1)
    ),
})
const responseSchemaBranches = zod
  .array(componentSchemaReference)
  .check(zod.minLength(2))
const responseExtensions = new Map([
  [
    "x-success-schema",
    ({ value, response, requestName, status }) => {
      const successSchema = componentSchemaReference.safeParse(value)

      if (!successSchema.success) {
        throw new Error(
          `Invalid x-success-schema at ${requestName}/${status}\n${zod.prettifyError(successSchema.error)}`
        )
      }

      const responseSchemas = responseSchemaBranches.safeParse(
        response.content?.["application/json"]?.schema?.oneOf ??
          response.content?.["application/json"]?.schema?.anyOf
      )

      if (!responseSchemas.success) {
        throw new Error(
          `Invalid response oneOf/anyOf for x-success-schema at ${requestName}/${status}\n${zod.prettifyError(responseSchemas.error)}`
        )
      }

      if (
        responseSchemas.data.filter(
          (branch) => branch.$ref === successSchema.data.$ref
        ).length !== 1
      ) {
        throw new Error(
          `x-success-schema must match exactly one response oneOf branch at ${requestName}/${status}`
        )
      }

      const schemas = responseSchemas.data.map((branch) =>
        pascal(
          decodeURIComponent(branch.$ref.slice("#/components/schemas/".length))
            .replaceAll("~1", "/")
            .replaceAll("~0", "~")
        )
      )
      const successIndex = responseSchemas.data.findIndex(
        (branch) => branch.$ref === successSchema.data.$ref
      )

      return [
        `        success: ${schemas[successIndex]},`,
        `        failures: [${schemas.filter((_, index) => index !== successIndex).join(", ")}],`,
      ]
    },
  ],
])
const projects = {}

for (const provider of (
  await readdir(openapiDirectory, { withFileTypes: true })
).toSorted((left, right) => left.name.localeCompare(right.name))) {
  if (!provider.isDirectory()) {
    continue
  }

  const documentPath = resolve(
    openapiDirectory,
    provider.name,
    "rest",
    "openapi.json"
  )

  try {
    await access(documentPath)
  } catch (error) {
    if (error?.code === "ENOENT") {
      continue
    }

    throw error
  }

  const overlayPath = resolve(
    openapiDirectory,
    provider.name,
    "rest",
    "overlay.yaml"
  )
  const document = JSON.parse(await readFile(documentPath, "utf8"))
  const overlay = await parseFile(overlayPath)

  if (
    overlay instanceof SyntaxError ||
    !overlay ||
    typeof overlay !== "object" ||
    Array.isArray(overlay)
  ) {
    throw new Error(`Invalid OpenAPI Overlay at ${overlayPath}`)
  }

  if (overlay.extends !== "./openapi.json") {
    throw new Error(
      `OpenAPI Overlay must extend ./openapi.json at ${overlayPath}`
    )
  }

  const overlayResult = await openapiOverlay(structuredClone(document), {
    overlaySet: overlay,
  })

  if (overlayResult.resultData.totalUnusedActions > 0) {
    throw new Error(
      `OpenAPI Overlay has ${overlayResult.resultData.totalUnusedActions} unmatched action(s) at ${overlayPath}`
    )
  }

  const mockDocument = overlayResult.data
  const mockOverrides = {}

  for (const [path, pathItem] of Object.entries(mockDocument.paths ?? {})) {
    for (const method of methods) {
      const request = pathItem[method]

      if (!request) {
        continue
      }

      if (
        typeof request.operationId !== "string" ||
        !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(request.operationId)
      ) {
        throw new Error(
          `Every REST request must have an identifier-safe operationId at ${method.toUpperCase()} ${path}`
        )
      }

      const successExamples = Object.entries(request.responses ?? {}).flatMap(
        ([status, response]) => {
          const example =
            response.content?.["application/json"]?.examples?.success

          return example && typeof example === "object" && "value" in example
            ? [{ status, value: example.value }]
            : []
        }
      )

      if (
        successExamples.length !== 1 ||
        !/^\d{3}$/.test(successExamples[0].status)
      ) {
        throw new Error(
          `Every REST request must have exactly one named success response example at ${request.operationId}`
        )
      }

      mockOverrides[request.operationId] = {
        mock: { data: successExamples[0].value },
      }
    }
  }

  const outputDirectory = resolve(generatedDirectory, provider.name, "rest")
  const target = resolve(outputDirectory, "api.ts")
  const scenariosTarget = resolve(outputDirectory, "api.scenarios.ts")
  const mockTarget = resolve(outputDirectory, "api.msw.ts")

  projects[`${provider.name}Rest`] = {
    input: {
      target: documentPath,
    },
    output: {
      target,
      mode: "single",
      client: "zod",
      formatter: "prettier",
      mock: {
        path: outputDirectory,
        generators: [
          {
            type: "msw",
            delay: false,
          },
        ],
      },
      override: {
        operations: mockOverrides,
        zod: {
          version: 4,
          variant: "mini",
          generateReusableSchemas: true,
          generateEachHttpStatus: true,
        },
      },
    },
    hooks: {
      afterAllFilesWrite: async () => {
        let generated = await readFile(target, "utf8")
        const contracts = []
        const requestNames = []

        for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
          for (const method of methods) {
            const request = pathItem[method]

            if (!request) {
              continue
            }

            const schemaPrefix = pascal(request.operationId)
            const parameters = [
              ...(Array.isArray(pathItem.parameters)
                ? pathItem.parameters
                : []),
              ...(Array.isArray(request.parameters) ? request.parameters : []),
            ]
            const requestSchemas = []
            const fixedHeaders = parameters.filter(
              (parameter) =>
                parameter.in === "header" &&
                parameter.required === true &&
                typeof parameter.name === "string" &&
                typeof parameter.schema?.const === "string"
            )

            if (parameters.some((parameter) => parameter.in === "path")) {
              requestSchemas.push(["params", `${schemaPrefix}Params`])
            }

            if (parameters.some((parameter) => parameter.in === "query")) {
              requestSchemas.push(["query", `${schemaPrefix}QueryParams`])
            }

            if (parameters.some((parameter) => parameter.in === "header")) {
              requestSchemas.push(["headers", `${schemaPrefix}Header`])
            }

            if (request.requestBody) {
              requestSchemas.push(["body", `${schemaPrefix}Body`])
            }

            const responses = []

            for (const [status, response] of Object.entries(
              request.responses ?? {}
            )) {
              const extensionLines = []

              for (const [key, value] of Object.entries(response)) {
                const plugin = responseExtensions.get(key)

                if (plugin) {
                  extensionLines.push(
                    ...plugin({
                      value,
                      response,
                      requestName: request.operationId,
                      status,
                    })
                  )
                }
              }

              responses.push(
                [
                  `      ${JSON.stringify(status)}: {`,
                  `        schema: ${pascal(`${request.operationId}-${status}-response`)},`,
                  ...extensionLines,
                  "      },",
                ].join("\n")
              )
            }

            contracts.push(
              [
                `const ${request.operationId}Contract = {`,
                `  method: ${JSON.stringify(method)},`,
                `  path: ${JSON.stringify(path)},`,
                "  request: {",
                ...requestSchemas.map(
                  ([key, schemaName]) => `    ${key}: ${schemaName},`
                ),
                ...(fixedHeaders.length === 0
                  ? []
                  : [
                      "    fixedHeaders: {",
                      ...fixedHeaders.map(
                        (parameter) =>
                          `      ${JSON.stringify(parameter.name)}: ${JSON.stringify(parameter.schema.const)},`
                      ),
                      "    },",
                    ]),
                "  },",
                "  responses: {",
                ...responses,
                "  },",
                "} as const",
              ].join("\n")
            )
            requestNames.push(request.operationId)
          }
        }

        generated = `${generated.trimEnd()}\n\n${contracts.join(
          "\n\n"
        )}\n\nexport const rest = {\n${requestNames
          .map((requestName) => `  ${requestName}: ${requestName}Contract,`)
          .join("\n")}\n} as const\n`

        await writeFile(target, generated)

        const mockResponseImports = []
        const mockResponses = []

        for (const [path, pathItem] of Object.entries(
          mockDocument.paths ?? {}
        )) {
          for (const method of methods) {
            const request = pathItem[method]

            if (!request) {
              continue
            }

            const scenarios = []
            let defaultResponse

            for (const [status, response] of Object.entries(
              request.responses ?? {}
            )) {
              const mediaType = response.content?.["application/json"]

              if (mediaType?.examples) {
                if (!/^\d{3}$/.test(status)) {
                  throw new Error(
                    `Named mock examples require an exact HTTP status at ${request.operationId}/${status}`
                  )
                }

                const directSchema = componentSchemaReference.safeParse(
                  mediaType.schema
                )
                const branches = responseSchemaBranches.safeParse(
                  mediaType.schema?.oneOf ?? mediaType.schema?.anyOf
                )
                const successSchema = componentSchemaReference.safeParse(
                  response["x-success-schema"]
                )

                for (const [name, example] of Object.entries(
                  mediaType.examples
                )) {
                  if (
                    !example ||
                    typeof example !== "object" ||
                    !("value" in example)
                  ) {
                    throw new Error(
                      `Every mock example must contain an inline value at ${request.operationId}/${status}/${name}`
                    )
                  }

                  let reference

                  if (directSchema.success) {
                    reference = directSchema.data.$ref
                  } else if (
                    branches.success &&
                    successSchema.success &&
                    name === "success"
                  ) {
                    reference = successSchema.data.$ref
                  } else if (branches.success && successSchema.success) {
                    const failures = branches.data.filter(
                      (branch) => branch.$ref !== successSchema.data.$ref
                    )

                    if (failures.length !== 1) {
                      throw new Error(
                        `A named failure example requires exactly one failure schema at ${request.operationId}/${status}/${name}`
                      )
                    }

                    reference = failures[0].$ref
                  } else {
                    throw new Error(
                      `Mock examples require a component schema at ${request.operationId}/${status}/${name}`
                    )
                  }

                  const responseType = pascal(
                    decodeURIComponent(
                      reference.slice("#/components/schemas/".length)
                    )
                      .replaceAll("~1", "/")
                      .replaceAll("~0", "~")
                  )

                  mockResponseImports.push(responseType)
                  scenarios.push(
                    [
                      `      ${JSON.stringify(name)}: {`,
                      `        status: ${Number(status)},`,
                      `        body: ${JSON.stringify(example.value, null, 2)
                        .split("\n")
                        .join("\n        ")} satisfies ${responseType},`,
                      "      },",
                    ].join("\n")
                  )
                }
              }

              if (status === "default" && "example" in (mediaType ?? {})) {
                const responseSchema = componentSchemaReference.safeParse(
                  mediaType.schema
                )

                if (!responseSchema.success) {
                  throw new Error(
                    `Default mock examples require a component schema at ${request.operationId}`
                  )
                }

                const responseType = pascal(
                  decodeURIComponent(
                    responseSchema.data.$ref.slice(
                      "#/components/schemas/".length
                    )
                  )
                    .replaceAll("~1", "/")
                    .replaceAll("~0", "~")
                )

                mockResponseImports.push(responseType)
                defaultResponse = [
                  "    default: {",
                  `      body: ${JSON.stringify(mediaType.example, null, 2)
                    .split("\n")
                    .join("\n      ")} satisfies ${responseType},`,
                  "    },",
                ].join("\n")
              }
            }

            if (scenarios.length === 0 || !defaultResponse) {
              throw new Error(
                `Every REST mock requires scenarios and a default response at ${request.operationId}`
              )
            }

            mockResponses.push(
              [
                `  ${request.operationId}: {`,
                `    method: ${JSON.stringify(method)},`,
                `    path: ${JSON.stringify(path)},`,
                "    scenarios: {",
                ...scenarios,
                "    },",
                defaultResponse,
                "  },",
              ].join("\n")
            )
          }
        }

        await writeFile(
          scenariosTarget,
          await format(
            [
              "// Generated from OpenAPI Overlay examples. Do not edit.",
              `import type { ${[...new Set(mockResponseImports)].join(", ")} } from "./api"`,
              "",
              "export const scenarios = {",
              ...mockResponses,
              "} as const",
              "",
            ].join("\n"),
            { ...prettierConfig, filepath: scenariosTarget }
          )
        )

        let generatedMock = await readFile(mockTarget, "utf8")
        const mockTypeImports = [...new Set(mockResponseImports)].filter(
          (name) => new RegExp(`\\b${name}\\b`).test(generatedMock)
        )

        generatedMock = `import type { ${mockTypeImports.join(", ")} } from "./api"\n\n${generatedMock}`
        await writeFile(
          mockTarget,
          await format(generatedMock, { filepath: mockTarget })
        )
      },
    },
  }
}

export default defineConfig(projects)
