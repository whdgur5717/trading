/* eslint-disable */
import type { NestExpressApplication } from "@nestjs/platform-express"
import { ModulesContainer, Reflector } from "@nestjs/core"
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from "@nestjs/swagger"
import { cleanupOpenApiDoc } from "nestjs-zod"
import { SKIP_API_RESPONSE } from "../common/api/response"
import { ApiErrorDto, ApiSuccessDto } from "../common/api/dto"

export function createSwaggerDocument(
  app: NestExpressApplication
): OpenAPIObject {
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Trading API")
    .setVersion("1.0")
    .setOpenAPIVersion("3.2.0")
    .build()

  const document = cleanupOpenApiDoc(
    SwaggerModule.createDocument(app, swaggerConfig, {
      extraModels: [ApiSuccessDto, ApiErrorDto],
    }),
    {
      version: "3.1",
    }
  )
  const reflector = app.get(Reflector)
  const skippedOperationIds = new Set<string>()

  for (const moduleRef of app.get(ModulesContainer).values()) {
    for (const controller of moduleRef.controllers.values()) {
      if (!controller.instance) {
        continue
      }

      const prototype = Object.getPrototypeOf(controller.instance)
      const controllerSkipped = reflector.get<boolean>(
        SKIP_API_RESPONSE,
        controller.instance.constructor
      )

      for (const propertyName of Object.getOwnPropertyNames(prototype)) {
        if (propertyName === "constructor") {
          continue
        }

        const handler = prototype[propertyName]

        if (typeof handler !== "function") {
          continue
        }

        if (
          controllerSkipped ||
          reflector.get<boolean>(SKIP_API_RESPONSE, handler)
        ) {
          skippedOperationIds.add(
            `${controller.instance.constructor.name}_${propertyName}`
          )
        }
      }
    }
  }

  for (const pathItem of Object.values(document.paths)) {
    for (const operation of Object.values(pathItem)) {
      if (
        !operation ||
        typeof operation !== "object" ||
        !("responses" in operation)
      ) {
        continue
      }

      const response = operation.responses["200"]

      if (!response || !("content" in response)) {
        continue
      }

      const eventStreamMedia = response.content?.["text/event-stream"]

      if (
        eventStreamMedia?.schema &&
        "items" in eventStreamMedia.schema &&
        eventStreamMedia.schema.items
      ) {
        Object.assign(eventStreamMedia, {
          itemSchema: eventStreamMedia.schema.items,
        })
      }

      if (
        operation.operationId &&
        skippedOperationIds.has(operation.operationId)
      ) {
        continue
      }

      operation.responses.default ??= {
        description: "Error",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiErrorDto",
            },
          },
        },
      }

      const media = response.content?.["application/json"]

      if (!media?.schema) {
        continue
      }

      media.schema = {
        allOf: [
          {
            $ref: "#/components/schemas/ApiSuccessDto",
          },
          {
            type: "object",
            properties: {
              data: media.schema,
            },
            required: ["data"],
          },
        ],
      }
    }
  }

  return document
}

export function configureSwagger(app: NestExpressApplication) {
  if (process.env.NODE_ENV === "production") {
    return
  }

  const swaggerDocument = createSwaggerDocument(app)

  SwaggerModule.setup("docs", app, swaggerDocument)
}
