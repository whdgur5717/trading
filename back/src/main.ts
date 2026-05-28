import { ConfigService } from "@nestjs/config"
import { NestFactory } from "@nestjs/core"
import { NestExpressApplication } from "@nestjs/platform-express"
import { AppModule } from "./app.module"
import { configureApp } from "./bootstrap/app-bootstrap"
import { configureSwagger } from "./bootstrap/swagger"

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const config = app.get(ConfigService)

  configureApp(app)
  configureSwagger(app)

  const port = config.getOrThrow<number>("PORT")
  const host = config.getOrThrow<string>("HOST")

  await app.listen(port, host)
}

bootstrap()
