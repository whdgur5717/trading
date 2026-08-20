import { Injectable } from "@nestjs/common"
import type { Result } from "neverthrow"
import type { Observable } from "rxjs"
import type { ExternalStreamFailure } from "../../../../error"
import { tradeTickSchema } from "../../../../schema"
import type {
  ExternalStreamState,
  StockSymbol,
  TradeTick,
} from "../../../../schema"
import { KisWebSocketClient } from "../client"
import type { KisWebSocketChannel, KisWebSocketSubscription } from "../channel"
import type { KisWebSocketFrame } from "../schema"
import { kisTradePayloadSchema } from "./schema"

const TRADE_TR_ID = "H0STCNT0"

@Injectable()
export class KisTradeClient implements KisWebSocketChannel<
  StockSymbol,
  TradeTick
> {
  constructor(private readonly websocket: KisWebSocketClient) {}

  subscribe(symbol: StockSymbol): Promise<Result<void, ExternalStreamFailure>> {
    return this.websocket.subscribe(this, symbol)
  }

  unsubscribe(symbol: StockSymbol): Result<void, ExternalStreamFailure> {
    return this.websocket.unsubscribe(this, symbol)
  }

  ticks(): Observable<TradeTick> {
    return this.websocket.events(this)
  }

  states(): Observable<ExternalStreamState> {
    return this.websocket.states()
  }

  subscription(symbol: StockSymbol): KisWebSocketSubscription {
    return { trId: TRADE_TR_ID, trKey: symbol }
  }

  accepts(frame: KisWebSocketFrame): boolean {
    return frame.trId === TRADE_TR_ID && !frame.encrypted
  }

  decode(frame: KisWebSocketFrame): TradeTick | null {
    const payload = kisTradePayloadSchema.safeParse(frame.payload)
    if (!payload.success || !payload.data) {
      return null
    }

    const tick = tradeTickSchema.safeParse(payload.data)
    return tick.success ? tick.data : null
  }
}
