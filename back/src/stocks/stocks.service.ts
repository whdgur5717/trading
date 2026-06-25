import { Inject, Injectable, Optional } from "@nestjs/common"
import { uniqBy } from "es-toolkit"
import { err, ok, type Result } from "neverthrow"
import type { Stock } from "./stock.schema"
import { STOCK_MASTER_DATA, stockMasterData } from "./stocks.data"
import type { StockError } from "./stocks.errors"

@Injectable()
export class StocksService {
  constructor(
    @Optional()
    @Inject(STOCK_MASTER_DATA)
    private readonly stocks: Stock[] = stockMasterData
  ) {}

  search(query: string): Stock[] {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)

    if (terms.length === 0) {
      return []
    }

    const exactCodeMatches = this.stocks.filter((stock) =>
      terms.includes(stock.symbol.toLowerCase())
    )

    if (exactCodeMatches.length > 0) {
      return uniqBy(exactCodeMatches, (stock) => stock.symbol)
    }

    const matches = this.stocks.filter((stock) => {
      const symbol = stock.symbol.toLowerCase()
      const name = stock.name.toLowerCase()

      return terms.some((term) => symbol.includes(term) || name.includes(term))
    })

    return uniqBy(matches, (stock) => stock.symbol).sort((a, b) => {
      const aExact = terms.some(
        (term) =>
          a.symbol.toLowerCase() === term || a.name.toLowerCase() === term
      )
      const bExact = terms.some(
        (term) =>
          b.symbol.toLowerCase() === term || b.name.toLowerCase() === term
      )

      if (aExact !== bExact) {
        return aExact ? -1 : 1
      }

      return a.name.localeCompare(b.name, "ko")
    })
  }

  getBySymbol(symbol: string): Result<Stock, StockError> {
    const stock = this.stocks.find((item) => item.symbol === symbol)

    if (!stock) {
      return err({
        type: "unsupported-stock",
        message: `Unsupported stock symbol: ${symbol}`,
      })
    }

    return ok(stock)
  }
}
