import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { AppCoreModule } from "../app-core.module"
import { validateEnv } from "../config/env.validation"
import { ExternalModule } from "./external/external.module"
import { MockRuntime } from "./mock.runtime"
import { OverrideModule } from "./override/override.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`],
      validate: validateEnv,
    }),
    AppCoreModule,
    ExternalModule,
    OverrideModule,
  ],
  providers: [MockRuntime],
  exports: [MockRuntime],
})
export class MockModule {}
