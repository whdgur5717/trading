import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { AppCoreModule } from "./app-core.module"
import { validateEnv } from "./config/env.validation"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`],
      validate: validateEnv,
    }),
    AppCoreModule,
  ],
})
export class AppModule {}
