import { Module } from "@nestjs/common"
import { vi } from "vitest"
import { PricesService } from "../prices.service"

export class PricesServiceMock {
  getQuote = vi.fn<PricesService["getQuote"]>()
  getDailyCandle = vi.fn<PricesService["getDailyCandle"]>()
  getCurrentPrice = vi.fn<PricesService["getCurrentPrice"]>()
}

@Module({
  providers: [
    {
      provide: PricesService,
      useClass: PricesServiceMock,
    },
  ],
  exports: [PricesService],
})
export class PricesTestingModule {}
