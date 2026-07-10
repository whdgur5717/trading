import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { ConfigService } from "@nestjs/config"
import { NestFactory } from "@nestjs/core"
import { NestExpressApplication } from "@nestjs/platform-express"
import { SwaggerModule, type OpenAPIObject } from "@nestjs/swagger"
import { AppModule } from "./app.module"
import { configureApp } from "./bootstrap/app-bootstrap"

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const config = app.get(ConfigService)

  configureApp(app)

  if (process.env.NODE_ENV !== "production") {
    const { createOpenApiDocument } = (await import(
      pathToFileURL(resolve(process.cwd(), "openapi/document.mjs")).href
    )) as {
      createOpenApiDocument: (app: NestExpressApplication) => OpenAPIObject
    }

    SwaggerModule.setup("docs", app, createOpenApiDocument(app))
  }

  const port = config.getOrThrow<number>("PORT")
  const host = config.getOrThrow<string>("HOST")

  await app.listen(port, host)
}

bootstrap()
