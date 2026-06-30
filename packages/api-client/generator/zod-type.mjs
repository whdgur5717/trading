const object = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {}
const strings = (value) =>
  Array.isArray(value) ? value.filter((item) => typeof item === "string") : []
const propertyKey = (name) =>
  /^[A-Za-z_$][\w$]*$/.test(name) ? name : JSON.stringify(name)
const schemaName = (ref) => `${ref.split("/").at(-1)}Schema`
const typeName = (ref) => ref.split("/").at(-1)

function schemaType(schema) {
  const type = schema.type

  return Array.isArray(type)
    ? type.find((item) => item !== "null")
    : typeof type === "string"
      ? type
      : undefined
}

function isNullable(schema) {
  return (
    schema.nullable === true ||
    schema.type === "null" ||
    (Array.isArray(schema.type) && schema.type.includes("null"))
  )
}

function isOnlyNull(schema) {
  return (
    schema.type === "null" ||
    (Array.isArray(schema.type) &&
      schema.type.length > 0 &&
      schema.type.every((item) => item === "null"))
  )
}

export function getZodType(schemaValue) {
  const schema = object(schemaValue)

  if (isOnlyNull(schema)) {
    return "z.null()"
  }

  let expression

  if (typeof schema.$ref === "string") {
    expression = schemaName(schema.$ref)
  } else if ("const" in schema) {
    expression = `z.literal(${JSON.stringify(schema.const)})`
  } else if (Array.isArray(schema.enum)) {
    expression =
      schema.enum.length === 0
        ? "z.never()"
        : schema.enum.every((value) => typeof value === "string")
          ? schema.enum.length === 1
            ? `z.literal(${JSON.stringify(schema.enum[0])})`
            : `z.enum([${schema.enum
                .map((value) => JSON.stringify(value))
                .join(", ")}])`
          : schema.enum.length === 1
            ? `z.literal(${JSON.stringify(schema.enum[0])})`
            : `z.union([${schema.enum
                .map((value) => `z.literal(${JSON.stringify(value)})`)
                .join(", ")}])`
  } else if (Array.isArray(schema.oneOf)) {
    expression =
      schema.oneOf.length === 1
        ? getZodType(schema.oneOf[0])
        : `z.union([${schema.oneOf.map(getZodType).join(", ")}])`
  } else if (Array.isArray(schema.anyOf)) {
    expression =
      schema.anyOf.length === 1
        ? getZodType(schema.anyOf[0])
        : `z.union([${schema.anyOf.map(getZodType).join(", ")}])`
  } else if (Array.isArray(schema.allOf)) {
    expression =
      schema.allOf.length === 0
        ? "z.unknown()"
        : schema.allOf
            .slice(1)
            .reduce(
              (current, item) =>
                `z.intersection(${current}, ${getZodType(item)})`,
              getZodType(schema.allOf[0])
            )
  } else {
    switch (schemaType(schema)) {
      case "string":
        expression = "z.string()"
        if (typeof schema.minLength === "number") {
          expression = `${expression}.min(${schema.minLength})`
        }
        if (typeof schema.maxLength === "number") {
          expression = `${expression}.max(${schema.maxLength})`
        }
        if (typeof schema.pattern === "string") {
          expression = `${expression}.regex(new RegExp(${JSON.stringify(
            schema.pattern
          )}))`
        }
        break
      case "integer":
      case "number":
        expression =
          schemaType(schema) === "integer" ? "z.number().int()" : "z.number()"
        if (typeof schema.minimum === "number") {
          expression = `${expression}.min(${schema.minimum})`
        }
        if (typeof schema.maximum === "number") {
          expression = `${expression}.max(${schema.maximum})`
        }
        if (typeof schema.exclusiveMinimum === "number") {
          expression = `${expression}.gt(${schema.exclusiveMinimum})`
        }
        if (
          schema.exclusiveMinimum === true &&
          typeof schema.minimum === "number"
        ) {
          expression = `${expression}.gt(${schema.minimum})`
        }
        if (typeof schema.exclusiveMaximum === "number") {
          expression = `${expression}.lt(${schema.exclusiveMaximum})`
        }
        if (
          schema.exclusiveMaximum === true &&
          typeof schema.maximum === "number"
        ) {
          expression = `${expression}.lt(${schema.maximum})`
        }
        break
      case "boolean":
        expression = "z.boolean()"
        break
      case "array":
        expression = `z.array(${getZodType(schema.items)})`
        break
      case "object": {
        const properties = object(schema.properties)
        const required = strings(schema.required)
        const entries = Object.entries(properties)

        if (entries.length === 0) {
          expression =
            schema.additionalProperties === true
              ? "z.record(z.string(), z.unknown())"
              : object(schema.additionalProperties) ===
                  schema.additionalProperties
                ? `z.record(z.string(), ${getZodType(
                    schema.additionalProperties
                  )})`
                : "z.object({})"
          break
        }

        expression = `z.object({\n${entries
          .map(([name, value]) => {
            const propertyType = getZodType(value)

            return `  ${propertyKey(name)}: ${
              required.includes(name)
                ? propertyType
                : `${propertyType}.optional()`
            }`
          })
          .join(",\n")}\n})`

        if (schema.additionalProperties === true) {
          expression = `${expression}.catchall(z.unknown())`
        } else if (
          object(schema.additionalProperties) === schema.additionalProperties
        ) {
          expression = `${expression}.catchall(${getZodType(
            schema.additionalProperties
          )})`
        }
        break
      }
      default:
        expression = "z.unknown()"
    }
  }

  return isNullable(schema) ? `${expression}.nullable()` : expression
}

export function getTypeScriptType(schemaValue) {
  const schema = object(schemaValue)

  if (isOnlyNull(schema)) {
    return "null"
  }

  let expression

  if (typeof schema.$ref === "string") {
    expression = typeName(schema.$ref)
  } else if ("const" in schema) {
    expression = JSON.stringify(schema.const)
  } else if (Array.isArray(schema.enum)) {
    expression = schema.enum.map((item) => JSON.stringify(item)).join(" | ")
  } else if (Array.isArray(schema.oneOf)) {
    expression = schema.oneOf.map(getTypeScriptType).join(" | ")
  } else if (Array.isArray(schema.anyOf)) {
    expression = schema.anyOf.map(getTypeScriptType).join(" | ")
  } else if (Array.isArray(schema.allOf)) {
    expression = schema.allOf.map(getTypeScriptType).join(" & ")
  } else {
    switch (schemaType(schema)) {
      case "string":
        expression = "string"
        break
      case "integer":
      case "number":
        expression = "number"
        break
      case "boolean":
        expression = "boolean"
        break
      case "array":
        expression = `Array<${getTypeScriptType(schema.items)}>`
        break
      case "object": {
        const properties = object(schema.properties)
        const required = strings(schema.required)
        const entries = Object.entries(properties)

        expression =
          entries.length === 0
            ? "Record<string, unknown>"
            : `{\n${entries
                .map(
                  ([name, value]) =>
                    `  ${propertyKey(name)}${required.includes(name) ? "" : "?"}: ${getTypeScriptType(
                      value
                    )}`
                )
                .join("\n")}\n}`
        break
      }
      default:
        expression = "unknown"
    }
  }

  return isNullable(schema) ? `${expression} | null` : expression
}
