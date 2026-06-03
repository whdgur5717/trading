import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { APP_PIPE } from "@nestjs/core"
import { ZodDtoValidationPipe } from "./common/zod-validation"
import { validateEnv } from "./config/env.validation"
import { HealthModule } from "./health/health.module"
import { PricesModule } from "./prices/prices.module"
import { RealtimeModule } from "./realtime/realtime.module"
import { ReturnsModule } from "./returns/returns.module"
import { StocksModule } from "./stocks/stocks.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`],
      validate: validateEnv,
    }),
    StocksModule,
    PricesModule,
    ReturnsModule,
    RealtimeModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodDtoValidationPipe,
    },
  ],
})
export class AppModule {}
