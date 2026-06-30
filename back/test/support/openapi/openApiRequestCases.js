export const jsonContentType = "application/json"
export const sseContentType = "text/event-stream"

const methods = ["get", "post", "put", "patch", "delete"]
const successStatus = "200"
const responseContentTypes = [jsonContentType, sseContentType]

export function openApiRequestCases(document) {
  return Object.entries(document.paths).flatMap(([path, pathItem]) =>
    methods.flatMap((method) => {
      const operation = pathItem[method]

      if (!operation) {
        return []
      }

      const response = operation.responses[successStatus]

      if (!response || "$ref" in response) {
        return []
      }

      const contentType = responseContentTypes.find(
        (candidate) => response.content?.[candidate]
      )

      if (!contentType) {
        return []
      }

      const extension = operation["x-test"]
      const metadata =
        extension && typeof extension === "object" ? extension : {}
      const target = requestTarget(path, operation.parameters ?? [], metadata)

      return [
        {
          contentType,
          expected: metadata.expect ?? {},
          method: method.toUpperCase(),
          name: `${method.toUpperCase()} ${path}`,
          path: target.path,
          query: target.query,
        },
      ]
    })
  )
}

function requestTarget(path, parameters, metadata) {
  const query = new URLSearchParams()
  let resolvedPath = path

  for (const parameter of parameters) {
    if ("$ref" in parameter) {
      throw new Error(`OpenAPI parameter reference is not supported: ${path}`)
    }

    const value = exampleValue(parameter, metadata.request ?? {})

    if (parameter.in === "path") {
      resolvedPath = resolvedPath.replace(
        `{${parameter.name}}`,
        encodeURIComponent(String(value))
      )
      continue
    }

    if (parameter.in === "query") {
      query.set(parameter.name, String(value))
    }
  }

  return {
    path: resolvedPath,
    query: query.toString(),
  }
}

function exampleValue(parameter, requestOverride) {
  const schema = parameter.schema
  const candidates = [
    requestOverride[parameter.in]?.[parameter.name],
    parameter.example,
    schema && !("$ref" in schema) ? schema.example : undefined,
    schema && !("$ref" in schema) ? schema.default : undefined,
    schema && !("$ref" in schema) ? schema.const : undefined,
  ]
  const value = candidates.find((candidate) => candidate !== undefined)

  if (value === undefined) {
    throw new Error(`OpenAPI parameter example is missing: ${parameter.name}`)
  }

  return value
}
