import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { AppCoreModule } from "../app-core.module"
import { validateEnv } from "../config/env.validation"
import { MockModule } from "./mock.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`],
      validate: validateEnv,
    }),
    AppCoreModule,
    MockModule,
  ],
})
export class MockAppModule {}
