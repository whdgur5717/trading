import { Injectable } from "@nestjs/common"
import { FscClient } from "./provider/fsc/rest/client"
import { KisRestClient } from "./provider/kis/rest/client"
import { KisTradeClient } from "./provider/kis/websocket/trade/client"
import { OpendartClient } from "./provider/opendart/rest/client"
import type {
  CandlesQuery,
  DisclosureQuery,
  FinancialAccountsQuery,
  MarketDayQuery,
  PriceQuery,
  StockSymbol,
} from "./schema"

/**
 * Public seam for external capabilities. Keep provider selection here so
 * application modules never depend on provider-specific clients.
 */
@Injectable()
export class ExternalService {
  constructor(
    private readonly kisRest: KisRestClient,
    private readonly kisTrades: KisTradeClient,
    private readonly fsc: FscClient,
    private readonly opendart: OpendartClient
  ) {}

  price(query: PriceQuery) {
    return this.kisRest.price(query)
  }

  candles(query: CandlesQuery) {
    return this.kisRest.candles(query)
  }

  async marketDay(query: MarketDayQuery) {
    const day = await this.kisRest.marketDay(query.date)

    return day.map((value) => ({
      ...value,
      quotationMarket: query.quotationMarket,
    }))
  }

  dailyStocks(date: string) {
    return this.fsc.dailyStocks(date)
  }

  dailyIndexes(date: string) {
    return this.fsc.dailyIndexes(date)
  }

  corpCode(symbol: string) {
    return this.opendart.corpCode(symbol)
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

  subscribeTrades(symbol: StockSymbol) {
    return this.kisTrades.subscribe(symbol)
  }

  unsubscribeTrades(symbol: StockSymbol) {
    return this.kisTrades.unsubscribe(symbol)
  }

  tradeTicks() {
    return this.kisTrades.ticks()
  }

  tradeStreamState() {
    return this.kisTrades.states()
  }
}
