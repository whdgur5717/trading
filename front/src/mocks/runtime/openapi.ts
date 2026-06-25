import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import get from "es-toolkit/compat/get"
import isPlainObject from "es-toolkit/compat/isPlainObject"

import type {
  MockContentType,
  MockOperation,
  MockRequestTemplate,
  MockResponseTemplate,
} from "./types"

type JsonRecord = Record<string, unknown>

const METHODS = ["get", "post", "put", "patch", "delete"] as const
const OPENAPI_PATHS = [
  resolve(process.cwd(), "../back/docs/openapi.json"),
  resolve(process.cwd(), "back/docs/openapi.json"),
]

async function readOpenApiDocument(): Promise<JsonRecord> {
  for (const path of OPENAPI_PATHS) {
    try {
      return JSON.parse(await readFile(path, "utf8")) as JsonRecord
    } catch (error: unknown) {
      if (get(error as object | null | undefined, "code") !== "ENOENT") {
        throw error
      }
    }
  }

  throw new Error("OpenAPI document was not found")
}

// function schemaConstString(schema: unknown): string | undefined {
//   if (!isPlainObject(schema)) {
//     return undefined
//   }

//   const record = schema as JsonRecord
//   const value =
//     typeof record.const === "string"
//       ? record.const
//       : Array.isArray(record.enum) && typeof record.enum[0] === "string"
//         ? record.enum[0]
//         : undefined

//   return value
// }

function schemaValue(schema: unknown, components: JsonRecord): unknown {
  if (!isPlainObject(schema)) {
    return undefined
  }

  const record = schema as JsonRecord

  if ("example" in record) {
    return structuredClone(record.example)
  }

  if ("default" in record) {
    return structuredClone(record.default)
  }

  if ("const" in record) {
    return structuredClone(record.const)
  }

  if (Array.isArray(record.enum) && record.enum.length > 0) {
    return structuredClone(record.enum[0])
  }

  if (typeof record.$ref === "string") {
    const name = record.$ref.split("/").at(-1)

    return name ? schemaValue(components[name], components) : undefined
  }

  if (Array.isArray(record.allOf)) {
    return record.allOf
      .map((item) => schemaValue(item, components))
      .reduce(
        (current, value) =>
          isPlainObject(current) && isPlainObject(value)
            ? { ...(current as JsonRecord), ...(value as JsonRecord) }
            : (current ?? value),
        undefined
      )
  }

  const variants = Array.isArray(record.oneOf)
    ? record.oneOf
    : Array.isArray(record.anyOf)
      ? record.anyOf
      : undefined

  if (variants) {
    return schemaValue(
      variants.find((item) => get(item as object, "type") !== "null") ??
        variants[0],
      components
    )
  }

  const type = Array.isArray(record.type)
    ? record.type.find((item) => item !== "null")
    : record.type

  if (type === "array") {
    const item = schemaValue(record.items, components)

    return item === undefined ? [] : [item]
  }

  if (type !== "object" || !isPlainObject(record.properties)) {
    return undefined
  }

  const required = new Set(
    Array.isArray(record.required)
      ? record.required.filter(
          (item): item is string => typeof item === "string"
        )
      : []
  )

  return Object.fromEntries(
    Object.entries(record.properties as JsonRecord).flatMap(
      ([name, property]) => {
        const propertyRecord = isPlainObject(property)
          ? (property as JsonRecord)
          : undefined
        const hasExample =
          propertyRecord !== undefined &&
          ("example" in propertyRecord ||
            "default" in propertyRecord ||
            "const" in propertyRecord ||
            "$ref" in propertyRecord ||
            Array.isArray(propertyRecord.enum))

        if (!required.has(name) && !hasExample) {
          return []
        }

        const value = schemaValue(property, components)

        return value === undefined ? [] : [[name, value]]
      }
    )
  )
}

// function eventStreamBody(schema: unknown, components: JsonRecord): unknown {
//   const itemSchemas = get(schema as object, ["items", "oneOf"])
//   const oneOfSchemas = get(schema as object, "oneOf")
//   const schemas = Array.isArray(itemSchemas)
//     ? itemSchemas
//     : Array.isArray(oneOfSchemas)
//       ? oneOfSchemas
//       : [schema]

//   return {
//     events: schemas.flatMap((item) => {
//       const event = schemaConstString(
//         get(item as object, ["properties", "event"])
//       )

//       if (
//         !event ||
//         event === "disconnected" ||
//         event === "error" ||
//         event === "reconnected"
//       ) {
//         return []
//       }

//       const data = schemaValue(
//         get(item as object, ["properties", "data"]),
//         components
//       )
//       const repeatMs =
//         event === "price" ? 1_000 : event === "heartbeat" ? 15_000 : undefined

//       return [
//         {
//           event,
//           data: data ?? null,
//           ...(repeatMs ? { repeatMs } : {}),
//         },
//       ]
//     }),
//   }
// }

function responseTemplates(
  status: string,
  response: JsonRecord,
  components: JsonRecord
): MockResponseTemplate[] {
  const jsonSchema = get(response, ["content", "application/json", "schema"])
  const eventSchema = get(response, ["content", "text/event-stream", "schema"])
  const contentType: MockContentType | undefined =
    jsonSchema !== undefined
      ? "application/json"
      : eventSchema !== undefined
        ? "text/event-stream"
        : undefined
  const schema = jsonSchema ?? eventSchema

  if (!contentType) {
    return []
  }

  const statusCode = Number(status)
  const variants =
    isPlainObject(schema) && Array.isArray((schema as JsonRecord).oneOf)
      ? ((schema as JsonRecord).oneOf as unknown[])
      : [schema]

  return variants.map((variant, index) => {
    const code = get(variant as object, [
      "properties",
      "error",
      "properties",
      "code",
      "const",
    ])
    const label = [status, typeof code === "string" ? code : undefined]
      .filter(Boolean)
      .join(" ")
    const body = schemaValue(variant, components)

    return {
      responseId: `${status}:${typeof code === "string" ? code : index}`,
      status: Number.isInteger(statusCode) ? statusCode : 0,
      label: label || status,
      contentType,
      body:
        contentType === "text/event-stream"
          ? `event: message\ndata: ${JSON.stringify(body)}\n\n`
          : body,
    }
  })
}

function requestTemplate(
  path: string,
  pathItem: JsonRecord,
  operation: JsonRecord,
  components: JsonRecord
): MockRequestTemplate {
  const parameters = [
    ...(Array.isArray(pathItem.parameters) ? pathItem.parameters : []),
    ...(Array.isArray(operation.parameters) ? operation.parameters : []),
  ]
  const query: Record<string, unknown> = {}
  let requestPath = path

  for (const parameter of parameters) {
    if (!isPlainObject(parameter) || typeof parameter.name !== "string") {
      continue
    }

    const value =
      "example" in parameter
        ? parameter.example
        : schemaValue(parameter.schema, components)

    if (value === undefined) {
      continue
    }

    if (parameter.in === "path") {
      requestPath = requestPath.replace(
        `{${parameter.name}}`,
        encodeURIComponent(String(value))
      )
    }

    if (parameter.in === "query") {
      query[parameter.name] = value
    }
  }

  return { path: requestPath, query }
}

export async function readMockOperations(): Promise<MockOperation[]> {
  const document = await readOpenApiDocument()
  const paths = get(document, "paths")
  const schemas = get(document, ["components", "schemas"])
  const components = isPlainObject(schemas) ? (schemas as JsonRecord) : {}

  if (!isPlainObject(paths)) {
    return []
  }

  return Object.entries(paths as JsonRecord).flatMap(([path, pathItem]) => {
    if (!isPlainObject(pathItem)) {
      return []
    }

    const pathItemRecord = pathItem as JsonRecord

    return METHODS.flatMap((method) => {
      const operation = pathItemRecord[method]

      if (!isPlainObject(operation)) {
        return []
      }

      const operationRecord = operation as JsonRecord

      if (typeof operationRecord.operationId !== "string") {
        return []
      }

      const responses = get(operationRecord, "responses")

      return [
        {
          operationId: operationRecord.operationId as string,
          method: method.toUpperCase() as MockOperation["method"],
          path,
          request: requestTemplate(
            path,
            pathItemRecord,
            operationRecord,
            components
          ),
          responses: isPlainObject(responses)
            ? Object.entries(responses as JsonRecord).flatMap(
                ([status, response]) =>
                  isPlainObject(response)
                    ? responseTemplates(
                        status,
                        response as JsonRecord,
                        components
                      )
                    : []
              )
            : [],
        },
      ]
    })
  })
}
