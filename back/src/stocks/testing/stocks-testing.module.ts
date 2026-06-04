import { Module } from "@nestjs/common"
import { vi } from "vitest"
import { StocksService } from "../stocks.service"

export class StocksServiceMock {
  getByCode = vi.fn<StocksService["getByCode"]>()
  search = vi.fn<StocksService["search"]>()
}

@Module({
  providers: [
    {
      provide: StocksService,
      useClass: StocksServiceMock,
    },
  ],
  exports: [StocksService],
})
export class StocksTestingModule {}
