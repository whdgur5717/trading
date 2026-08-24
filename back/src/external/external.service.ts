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
    return this.kisRest.marketDay(query.date)
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

  tradeStream(symbols: StockSymbol[]) {
    return this.kisTrades.watch(symbols)
  }
}
