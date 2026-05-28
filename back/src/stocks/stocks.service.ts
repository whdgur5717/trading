import { Inject, Injectable, NotFoundException, Optional } from "@nestjs/common"
import { uniqBy } from "es-toolkit"
import type { Stock } from "./stock.schema"
import { STOCK_MASTER_DATA, stockMasterData } from "./stocks.data"

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
      terms.includes(stock.code.toLowerCase())
    )

    if (exactCodeMatches.length > 0) {
      return uniqBy(exactCodeMatches, (stock) => stock.code)
    }

    const matches = this.stocks.filter((stock) => {
      const code = stock.code.toLowerCase()
      const name = stock.name.toLowerCase()

      return terms.some((term) => code.includes(term) || name.includes(term))
    })

    return uniqBy(matches, (stock) => stock.code).sort((a, b) => {
      const aExact = terms.some(
        (term) => a.code.toLowerCase() === term || a.name.toLowerCase() === term
      )
      const bExact = terms.some(
        (term) => b.code.toLowerCase() === term || b.name.toLowerCase() === term
      )

      if (aExact !== bExact) {
        return aExact ? -1 : 1
      }

      return a.name.localeCompare(b.name, "ko")
    })
  }

  getByCode(code: string): Stock {
    const stock = this.stocks.find((item) => item.code === code)

    if (!stock) {
      throw new NotFoundException(`Unknown stock code: ${code}`)
    }

    return stock
  }
}
