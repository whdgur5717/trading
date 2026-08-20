import { Injectable } from "@nestjs/common"
import { ResultAsync } from "neverthrow"
import { ExternalService } from "../external/external.service"
import { StocksService } from "../stocks/stocks.service"

@Injectable()
export class PricesService {
  constructor(
    private readonly stocksService: StocksService,
    private readonly externalService: ExternalService
  ) {}

  getPrice(symbol: string) {
    return this.stocksService.getBySymbol(symbol).asyncAndThen((stock) =>
      ResultAsync.fromSafePromise(
        this.externalService.price({
          symbol,
          quotationMarket: stock.quotationMarket,
        })
      )
        .andThen((price) => price)
        .map((price) => ({
          symbol,
          currentPrice: String(price.currentPrice),
          openPrice: String(price.openPrice),
          highPrice: String(price.highPrice),
          lowPrice: String(price.lowPrice),
          volume: String(price.volume),
          changePrice: String(price.changePrice),
          changeRate: String(price.changeRate),
        }))
    )
  }
}
