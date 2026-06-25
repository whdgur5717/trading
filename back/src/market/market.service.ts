import { Inject, Injectable } from "@nestjs/common"
import type { Result } from "neverthrow"
import type { MarketDataError } from "./market-data.error"
import { FscAdaptor } from "./adaptor/fsc/fsc.adaptor"
import { OpendartAdaptor } from "./adaptor/opendart/opendart.adaptor"
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
    @Inject(MARKET_DATA_PORT) private readonly marketData: MarketDataPort,
    private readonly fsc: FscAdaptor,
    private readonly opendart: OpendartAdaptor
  ) {}

  price(query: PriceQuery): Promise<Result<Price, MarketDataError>> {
    return this.marketData
      .price(query)
      .then((result) => result.mapErr(toMarketError))
  }

  candles(query: CandlesQuery): Promise<Result<Candle[], MarketDataError>> {
    return this.marketData
      .candles(query)
      .then((result) => result.mapErr(toMarketError))
  }

  marketDay(
    query: MarketDayQuery
  ): Promise<Result<MarketDay, MarketDataError>> {
    return this.marketData
      .marketDay(query)
      .then((result) => result.mapErr(toMarketError))
  }

  dailyStocks(
    date: string
  ): Promise<Result<DailyStockPrice[], MarketDataError>> {
    return this.fsc.dailyStocks(date)
  }

  dailyIndexes(
    date: string
  ): Promise<Result<DailyMarketIndex[], MarketDataError>> {
    return this.fsc.dailyIndexes(date)
  }

  corpCode(stockCode: string): Result<string, MarketDataError> {
    return this.opendart.corpCode(stockCode)
  }

  company(corpCode: string): Promise<Result<CompanyProfile, MarketDataError>> {
    return this.opendart.company(corpCode)
  }

  disclosures(
    query: DisclosureQuery
  ): Promise<Result<MarketDisclosure[], MarketDataError>> {
    return this.opendart.disclosures(query)
  }

  financialAccounts(
    query: FinancialAccountsQuery
  ): Promise<Result<FinancialAccount[], MarketDataError>> {
    return this.opendart.financialAccounts(query)
  }
}

function toMarketError(error: MarketDataError): MarketDataError {
  return error
}
