import { Test } from "@nestjs/testing"
import type { NestExpressApplication } from "@nestjs/platform-express"
import { configureApp } from "../../src/bootstrap/app-bootstrap"

export async function createApp(): Promise<NestExpressApplication> {
  const { AppModule } = await import("../../src/app.module.js")
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  const app = moduleRef.createNestApplication<NestExpressApplication>()
  configureApp(app)

  return app
}
