import { getSchemaPath, type ApiResponseOptions } from "@nestjs/swagger"
import { API_ERROR_STATUS } from "../../common/api/api.errors"
import { API_ERRORS } from "../../common/error/error-catalog"
import type { DtoClass } from "./response-contract"

const COMMON_ERROR_CODES = ["invalid-request", "internal-error"] as const

type ErrorItem = {
  readonly code: string
  readonly description: string
  readonly message: string
}

function errorResponseSchema(status: number, item: ErrorItem) {
  return {
    type: "object",
    required: ["success", "error"],
    properties: {
      success: { type: "boolean", const: false },
      error: {
        type: "object",
        required: ["status", "code", "message"],
        properties: {
          status: { type: "number", const: status },
          code: { type: "string", const: item.code },
          message: { type: "string", example: item.message },
          details: {},
        },
      },
    },
  }
}

function errorStatusSchema(status: number, items: readonly ErrorItem[]) {
  const schemas = items.map((item) => errorResponseSchema(status, item))

  return schemas.length === 1 ? schemas[0] : { oneOf: schemas }
}

export function successResponse(
  dto: DtoClass,
  isArray: boolean
): ApiResponseOptions {
  return {
    status: 200,
    description: "",
    schema: {
      type: "object",
      required: ["success", "data"],
      properties: {
        success: { type: "boolean", enum: [true] },
        data: isArray
          ? { type: "array", items: { $ref: getSchemaPath(dto.name) } }
          : { $ref: getSchemaPath(dto.name) },
      },
    },
  }
}

export function errorResponses(
  errorCodes: readonly string[]
): readonly ApiResponseOptions[] {
  const grouped = new Map<number, ErrorItem[]>()

  for (const code of new Set([...COMMON_ERROR_CODES, ...errorCodes])) {
    const entry = Object.entries(API_ERRORS).find(
      ([candidate]) => candidate === code
    )

    if (!entry) {
      continue
    }

    const [knownCode, definition] = entry
    const status = Object.entries(API_ERROR_STATUS).find(
      ([candidate]) => candidate === knownCode
    )?.[1]

    if (status === undefined) {
      continue
    }

    const items = grouped.get(status) ?? []
    items.push({
      code: knownCode,
      description: definition.description,
      message: definition.message,
    })
    grouped.set(status, items)
  }

  return [...grouped.entries()].map(([status, items]) => ({
    status,
    description: items.map((item) => item.description).join("\n"),
    schema: errorStatusSchema(status, items),
  }))
}
