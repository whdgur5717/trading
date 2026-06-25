import { ConfigService } from "@nestjs/config"
import { NestFactory } from "@nestjs/core"
import { NestExpressApplication } from "@nestjs/platform-express"
import { AppModule } from "./app.module"
import { configureApp } from "./bootstrap/app-bootstrap"

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const config = app.get(ConfigService)

  configureApp(app)

  if (process.env.NODE_ENV !== "production") {
    const { configureSwagger } = await import("./bootstrap/swagger.js")

    configureSwagger(app)
  }

  const port = config.getOrThrow<number>("PORT")
  const host = config.getOrThrow<string>("HOST")

  await app.listen(port, host)
}

bootstrap()
