import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve } from "node:path"
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiResponse,
  DocumentBuilder,
  getSchemaPath,
  SwaggerModule,
} from "@nestjs/swagger"
import { cleanupOpenApiDoc } from "nestjs-zod"
import { z } from "zod"

const contractPath = resolve(process.cwd(), "dist/openapi-contracts.json")
const requireFromContract = createRequire(contractPath)

export function createOpenApiDocument(app) {
  const contract = JSON.parse(readFileSync(contractPath, "utf8"))

  for (const route of contract.routes) {
    const controller = requireFromContract(route.controllerModule)[
      route.controller
    ]
    const successDto = requireFromContract(route.success.module)[
      route.success.exportName
    ]
    const descriptor = Object.getOwnPropertyDescriptor(
      controller.prototype,
      route.method
    )

    ApiExtraModels(successDto)(controller.prototype, route.method, descriptor)
    ApiOkResponse({
      schema: successSchema(successDto, route.success.isArray),
    })(controller.prototype, route.method, descriptor)

    const errorsByStatus = new Map()

    for (const error of route.errors) {
      const factory = requireFromContract(error.module)[error.exportName][
        error.key
      ]
      const errors = errorsByStatus.get(factory.status) ?? []

      errors.push(factory)
      errorsByStatus.set(factory.status, errors)
    }

    for (const [status, errors] of errorsByStatus) {
      ApiResponse({
        status,
        description: errors.map((error) => error.description).join("\n"),
        content: {
          "application/json": {
            schema: {
              oneOf: errors.map(errorSchema),
            },
          },
        },
      })(controller.prototype, route.method, descriptor)
    }
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Trading API")
    .setVersion("1.0")
    .setOpenAPIVersion("3.2.0")
    .build()

  return cleanupOpenApiDoc(SwaggerModule.createDocument(app, swaggerConfig), {
    version: "3.1",
  })
}

function successSchema(dto, isArray) {
  return {
    type: "object",
    required: ["success", "data"],
    properties: {
      success: { type: "boolean", enum: [true] },
      data: isArray
        ? { type: "array", items: { $ref: getSchemaPath(dto) } }
        : { $ref: getSchemaPath(dto) },
    },
  }
}

function errorSchema(error) {
  return {
    type: "object",
    required: ["success", "error"],
    properties: {
      success: { type: "boolean", enum: [false] },
      error: {
        type: "object",
        required: ["type", "status", "message", "data"],
        properties: {
          type: { type: "string", enum: [error.type] },
          status: { type: "number", enum: [error.status] },
          message: { type: "string", example: error.message },
          data: dataSchema(error.dataSchema),
        },
      },
    },
  }
}

function dataSchema(schema) {
  const jsonSchema = z.toJSONSchema(schema)

  delete jsonSchema.$schema

  return jsonSchema
}
