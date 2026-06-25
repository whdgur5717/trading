import { Inject, Injectable, Optional } from "@nestjs/common"
import { canBeChoseong, getChoseong } from "es-hangul"
import { STOCK_MASTER_DATA, stockMasterData } from "../stocks.data"
import type { Stock, StockProductType } from "../stock.schema"
import type { Suggestion } from "./suggestion.schema"

type IndexedStock = {
  stock: Stock
  symbol: string
  name: string
  nameChoseong: string
}

type MatchedStock = {
  item: IndexedStock
  matchRank: number
  productRank: number
  statusRank: number
  indexRank: number
}

const PRODUCT_KEYWORDS = [
  "kodex",
  "tiger",
  "ace",
  "rise",
  "sol",
  "plus",
  "hanaro",
  "kosef",
  "kbstar",
  "kiwoom",
  "etf",
  "etn",
  "nav",
  "레버리지",
  "인버스",
  "선물",
  "채권",
  "커버드콜",
  "합성",
]

const NORMAL_PRODUCT_RANK: Record<StockProductType, number> = {
  STOCK: 0,
  PREFERRED: 1,
  REIT: 2,
  BENEFICIARY_CERTIFICATE: 3,
  ETF: 4,
  ETN: 5,
  SPAC: 6,
  OTHER: 6,
}

const PRODUCT_QUERY_PRODUCT_RANK: Record<StockProductType, number> = {
  ...NORMAL_PRODUCT_RANK,
  ETF: 0,
  ETN: 0,
}

const MATCHERS = [
  (item: IndexedStock, input: string) => item.symbol === input,
  (item, input) => item.symbol.startsWith(input),
  (item, input) => item.name === input,
  (item, input) => item.name.startsWith(input),
  (item, input) => matchesKoreanPrefix(input, item.name),
  (item, input) => item.name.includes(input),
  (item, input) => item.nameChoseong.includes(input),
] satisfies Array<(item: IndexedStock, input: string) => boolean>

@Injectable()
export class SuggestionService {
  private readonly index: IndexedStock[]

  constructor(
    @Optional()
    @Inject(STOCK_MASTER_DATA)
    stocks: Stock[] = stockMasterData
  ) {
    this.index = stocks.map((stock) => {
      const name = normalizeInput(stock.name)

      return {
        stock,
        symbol: normalizeInput(stock.symbol),
        name,
        nameChoseong: getChoseong(name),
      }
    })
  }

  suggest(input: string, limit: number): Suggestion {
    const query = normalizeInput(input)

    if (query.length === 0 || limit < 1) {
      return { items: [], hasMore: false }
    }

    const productRanks = PRODUCT_KEYWORDS.some((keyword) =>
      query.includes(keyword)
    )
      ? PRODUCT_QUERY_PRODUCT_RANK
      : NORMAL_PRODUCT_RANK

    const matches = this.index.flatMap((item) => {
      const matchRank = MATCHERS.findIndex((matches) => matches(item, query))

      if (matchRank === -1) {
        return []
      }

      const stock = item.stock
      const productType = stock.productType ?? "STOCK"

      return [
        {
          item,
          matchRank,
          productRank: productRanks[productType],
          statusRank:
            (stock.isTradingHalted ? 3 : 0) +
            (stock.isUnderAdministration ? 2 : 0) +
            (stock.isLowLiquidity ? 1 : 0),
          indexRank:
            (stock.isKospi50 ? 3 : 0) +
            (stock.isKospi100 ? 2 : 0) +
            (stock.isKrx300 ? 1 : 0),
        },
      ]
    })

    matches.sort(compareSuggestion)

    return {
      items: matches.slice(0, limit).map(({ item }) => item.stock),
      hasMore: matches.length > limit,
    }
  }
}

function normalizeInput(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "")
}

function matchesKoreanPrefix(input: string, name: string): boolean {
  const inputLetters = [...input]
  const nameLetters = [...name]
  let nameIndex = 0

  for (let inputIndex = 0; inputIndex < inputLetters.length; inputIndex += 1) {
    const inputLetter = inputLetters[inputIndex]
    let matched = false

    while (nameIndex < nameLetters.length) {
      const nameLetter = nameLetters[nameIndex]
      const isMatch = canBeChoseong(inputLetter)
        ? getChoseong(nameLetter) === inputLetter
        : nameLetter === inputLetter

      nameIndex += 1

      if (isMatch) {
        matched = true
        break
      }

      if (inputIndex === 0 || !canBeChoseong(inputLetter)) {
        return false
      }
    }

    if (!matched) {
      return false
    }
  }

  return true
}

function compareSuggestion(a: MatchedStock, b: MatchedStock): number {
  return (
    a.matchRank - b.matchRank ||
    a.productRank - b.productRank ||
    a.statusRank - b.statusRank ||
    b.indexRank - a.indexRank ||
    (b.item.stock.marketCap ?? 0) - (a.item.stock.marketCap ?? 0) ||
    (b.item.stock.previousVolume ?? 0) - (a.item.stock.previousVolume ?? 0) ||
    a.item.stock.name.localeCompare(b.item.stock.name, "ko") ||
    a.item.stock.symbol.localeCompare(b.item.stock.symbol)
  )
}
