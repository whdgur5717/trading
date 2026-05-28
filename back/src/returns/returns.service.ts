import { BadRequestException, Injectable } from "@nestjs/common"
import { KisService } from "../kis/kis.service"
import { StocksService } from "../stocks/stocks.service"
import { ReturnsCalculatorService } from "./returns-calculator.service"
import type { ReturnSummary } from "./returns.schema"

@Injectable()
export class ReturnsService {
  constructor(
    private readonly stocksService: StocksService,
    private readonly kisService: KisService,
    private readonly calculator: ReturnsCalculatorService
  ) {}

  async calculate(
    code: string,
    buyDate: string,
    quantity: number
  ): Promise<ReturnSummary> {
    const stock = this.stocksService.getByCode(code)
    const [history, current] = await Promise.all([
      this.kisService.getDailyPrice(code, buyDate, stock.kisMarketCode),
      this.kisService.getCurrentPrice(code, stock.kisMarketCode),
    ])

    if (!history.isTradingDay || !history.candle) {
      throw new BadRequestException(
        `${buyDate} is not a trading day for ${code}`
      )
    }

    const result = this.calculator.calculate({
      buyPrice: history.candle.closePrice,
      currentPrice: current.currentPrice,
      quantity,
    })

    return {
      stock,
      buy: {
        date: buyDate,
        price: history.candle.closePrice,
        priceType: "adjusted-close",
        quantity,
      },
      current: {
        price: current.currentPrice,
        source: "kis-rest-current-price",
        marketCode: stock.kisMarketCode,
      },
      result,
    }
  }
}
