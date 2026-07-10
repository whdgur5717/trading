import { Injectable } from "@nestjs/common"
import { FscAdaptor } from "./adaptor/fsc/fsc.adaptor"
import { KisMarketDataAdaptor } from "./adaptor/kis/marketData.adaptor"
import { OpendartAdaptor } from "./adaptor/opendart/opendart.adaptor"
import type {
  CandlesQuery,
  DisclosureQuery,
  FinancialAccountsQuery,
  MarketDayQuery,
  PriceQuery,
} from "./market.schema"
import type { MarketDataPort } from "./port/data"

@Injectable()
export class MarketDataAdaptor implements MarketDataPort {
  constructor(
    private readonly kis: KisMarketDataAdaptor,
    private readonly fsc: FscAdaptor,
    private readonly opendart: OpendartAdaptor
  ) {}

  price(query: PriceQuery) {
    return this.kis.price(query)
  }

  candles(query: CandlesQuery) {
    return this.kis.candles(query)
  }

  marketDay(query: MarketDayQuery) {
    return this.kis.marketDay(query)
  }

  dailyStocks(date: string) {
    return this.fsc.dailyStocks(date)
  }

  dailyIndexes(date: string) {
    return this.fsc.dailyIndexes(date)
  }

  corpCode(stockCode: string) {
    return this.opendart.corpCode(stockCode)
  }

  company(corpCode: string) {
    return this.opendart.company(corpCode)
  }

  disclosures(query: DisclosureQuery) {
    return this.opendart.disclosures(query)
  }

  financialAccounts(query: FinancialAccountsQuery) {
    return this.opendart.financialAccounts(query)
  }
}
