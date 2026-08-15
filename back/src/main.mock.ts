import { ConfigService } from "@nestjs/config"
import { NestFactory } from "@nestjs/core"
import type { NestExpressApplication } from "@nestjs/platform-express"
import type { NextFunction, Request, Response } from "express"
import { configureApp } from "./bootstrap/app-bootstrap"
import { MockModule } from "./mock/mock.module"

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(MockModule)
  const config = app.get(ConfigService)

  configureApp(app)
  app.use((request: Request, _response: Response, next: NextFunction) => {
    console.log(`[HTTP] ${request.method} ${request.originalUrl}`)
    next()
  })

  const port = config.getOrThrow<number>("PORT")
  const host = config.getOrThrow<string>("HOST")

  await app.listen(port, host)
  console.log(`Mock backend listening at http://${host}:${port}`)
}

bootstrap().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
