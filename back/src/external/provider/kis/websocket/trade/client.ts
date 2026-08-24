import { Injectable } from "@nestjs/common"
import { defer, filter, finalize, ignoreElements, map, merge, scan } from "rxjs"
import { tradeTickSchema } from "../../../../schema"
import type {
  ExternalStreamState,
  StockSymbol,
  TradeTick,
  TradeStreamEvent,
} from "../../../../schema"
import { KisWebSocketClient } from "../client"
import type { KisWebSocketChannel, KisWebSocketSubscription } from "../channel"
import type { KisWebSocketFrame } from "../schema"
import { kisTradePayloadSchema } from "./schema"

const TRADE_TR_ID = "H0UNCNT0"

@Injectable()
export class KisTradeClient implements KisWebSocketChannel<
  StockSymbol,
  TradeTick
> {
  constructor(private readonly websocket: KisWebSocketClient) {}

  watch(symbols: StockSymbol[]) {
    const requested = new Set(symbols)
    const activation = defer(() =>
      Promise.all(
        [...requested].map((symbol) => this.websocket.subscribe(this, symbol))
      )
    ).pipe(ignoreElements())

    const states = this.websocket.states().pipe(
      scan<
        ExternalStreamState,
        {
          disconnected: boolean
          event: TradeStreamEvent | null
        }
      >(
        (previous, state) => {
          switch (state.status) {
            case "connected":
              return {
                disconnected: false,
                event: previous.disconnected ? { type: "reconnected" } : null,
              }
            case "disconnected":
              return {
                disconnected: true,
                event: {
                  type: "disconnected",
                  closeCode: state.closeCode,
                  reason: state.reason,
                },
              }
            case "unavailable":
              return {
                disconnected: previous.disconnected,
                event: {
                  type: "unavailable",
                  message: state.message,
                  retryAfterMs: state.retryAfterMs,
                },
              }
          }
        },
        { disconnected: false, event: null }
      ),
      map(({ event }) => event),
      filter((event): event is TradeStreamEvent => event !== null)
    )

    return merge(
      states,
      this.websocket.events(this).pipe(
        filter((trade) => requested.has(trade.symbol)),
        map((trade): TradeStreamEvent => ({ type: "trade", trade }))
      ),
      activation
    ).pipe(
      finalize(() => {
        for (const symbol of requested) {
          this.websocket.unsubscribe(this, symbol)
        }
      })
    )
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
