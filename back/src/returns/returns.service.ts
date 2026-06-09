import { BadRequestException, Injectable } from "@nestjs/common"
import { PricesService } from "../prices/prices.service"
import { calculateReturnResult } from "./returns-calculation"
import type { ReturnSummary } from "./returns.schema"

@Injectable()
export class ReturnsService {
  constructor(private readonly pricesService: PricesService) {}

  async calculate(
    code: string,
    buyDate: string,
    quantity: number
  ): Promise<ReturnSummary> {
    const [buyDay, current] = await Promise.all([
      this.pricesService.getDailyCandle(code, buyDate),
      this.pricesService.getCurrentPrice(code),
    ])

    if (!buyDay.isTradingDay || !buyDay.candle) {
      throw new BadRequestException(
        `${buyDate} is not a trading day for ${code}`
      )
    }

    const result = calculateReturnResult({
      buyPrice: buyDay.candle.closePrice,
      currentPrice: current.price,
      quantity,
    })

    return {
      stock: buyDay.stock,
      buy: {
        date: buyDate,
        price: buyDay.candle.closePrice,
        priceType: "adjusted-close",
        quantity,
      },
      current: {
        price: current.price,
        source: current.source,
        quotationMarket: current.quotationMarket,
        basis: current.basis,
      },
      result,
    }
  }
}
