import { Test } from "@nestjs/testing"
import { ConfigModule } from "@nestjs/config"
import type { NestExpressApplication } from "@nestjs/platform-express"
import { configureApp } from "../../src/bootstrap/app-bootstrap"
import { validateEnv, type AppEnv } from "../../src/config/env.validation"

interface CreateAppOptions {
  readonly config?: Partial<AppEnv>
}

export async function createApp(
  options: CreateAppOptions = {}
): Promise<NestExpressApplication> {
  const { AppCoreModule } = await import("../../src/app-core.module.js")
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: [".env.test"],
        load: [() => options.config ?? {}],
        validate: validateEnv,
      }),
      AppCoreModule,
    ],
  }).compile()

  const app = moduleRef.createNestApplication<NestExpressApplication>()
  configureApp(app)

  return app
}
