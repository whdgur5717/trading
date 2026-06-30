import { Module } from "@nestjs/common"
import { APP_PIPE } from "@nestjs/core"
import { CandlesModule } from "./candles/candles.module"
import { ZodDtoValidationPipe } from "./common/validation/zod"
import { HealthModule } from "./health/health.module"
import { PricesModule } from "./prices/prices.module"
import { RealtimeModule } from "./realtime/realtime.module"
import { ReturnsModule } from "./returns/returns.module"
import { StocksModule } from "./stocks/stocks.module"

@Module({
  imports: [
    StocksModule,
    PricesModule,
    CandlesModule,
    ReturnsModule,
    RealtimeModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodDtoValidationPipe,
    },
  ],
})
export class AppCoreModule {}
