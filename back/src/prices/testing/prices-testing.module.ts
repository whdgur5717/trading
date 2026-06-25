import { Module } from "@nestjs/common"
import { vi } from "vitest"
import { PricesService } from "../prices.service"

export class PricesServiceMock {
  getPrice = vi.fn<PricesService["getPrice"]>()
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
