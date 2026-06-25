import type { NestExpressApplication } from "@nestjs/platform-express"
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from "@nestjs/swagger"
import { cleanupOpenApiDoc } from "nestjs-zod"
import { applyOpenApiResponseMetadata } from "./openapi/response-metadata"

export function createSwaggerDocument(
  app: NestExpressApplication
): OpenAPIObject {
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Trading API")
    .setVersion("1.0")
    .setOpenAPIVersion("3.2.0")
    .build()

  applyOpenApiResponseMetadata(app)

  return cleanupOpenApiDoc(SwaggerModule.createDocument(app, swaggerConfig), {
    version: "3.1",
  })
}

export function configureSwagger(app: NestExpressApplication) {
  if (process.env.NODE_ENV === "production") {
    return
  }

  const swaggerDocument = createSwaggerDocument(app)

  SwaggerModule.setup("docs", app, swaggerDocument)
}
