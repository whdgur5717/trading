import { Inject, Injectable } from "@nestjs/common"
import type { Result } from "neverthrow"
import type { MarketDataError } from "./market-data.error"
import { MARKET_DATA_PORT, type MarketDataPort } from "./port/data"
import type {
  CandlesQuery,
  Candle,
  CompanyProfile,
  DailyMarketIndex,
  DailyStockPrice,
  DisclosureQuery,
  FinancialAccount,
  FinancialAccountsQuery,
  MarketDay,
  MarketDayQuery,
  MarketDisclosure,
  Price,
  PriceQuery,
} from "./market.schema"

@Injectable()
export class MarketService {
  constructor(
    @Inject(MARKET_DATA_PORT) private readonly marketData: MarketDataPort
  ) {}

  price(query: PriceQuery): Promise<Result<Price, MarketDataError>> {
    return this.marketData.price(query)
  }

  candles(query: CandlesQuery): Promise<Result<Candle[], MarketDataError>> {
    return this.marketData.candles(query)
  }

  marketDay(
    query: MarketDayQuery
  ): Promise<Result<MarketDay, MarketDataError>> {
    return this.marketData.marketDay(query)
  }

  dailyStocks(
    date: string
  ): Promise<Result<DailyStockPrice[], MarketDataError>> {
    return this.marketData.dailyStocks(date)
  }

  dailyIndexes(
    date: string
  ): Promise<Result<DailyMarketIndex[], MarketDataError>> {
    return this.marketData.dailyIndexes(date)
  }

  corpCode(stockCode: string): Result<string, MarketDataError> {
    return this.marketData.corpCode(stockCode)
  }

  company(corpCode: string): Promise<Result<CompanyProfile, MarketDataError>> {
    return this.marketData.company(corpCode)
  }

  disclosures(
    query: DisclosureQuery
  ): Promise<Result<MarketDisclosure[], MarketDataError>> {
    return this.marketData.disclosures(query)
  }

  financialAccounts(
    query: FinancialAccountsQuery
  ): Promise<Result<FinancialAccount[], MarketDataError>> {
    return this.marketData.financialAccounts(query)
  }
}
