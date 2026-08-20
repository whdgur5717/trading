import { Injectable } from "@nestjs/common"
import { filter, from, map, merge, Observable, scan, Subscription } from "rxjs"
import { ExternalService } from "../../../external/external.service"
import type { ExternalStreamState, StockSymbol } from "../../../external/schema"
import type { RealtimeEvent } from "../../event"
import { RealtimeBroker } from "../realtime-broker.contract"

type ConnectionEvents = {
  readonly disconnected: boolean
  readonly event: RealtimeEvent | null
}

@Injectable()
export class LocalRealtimeBroker extends RealtimeBroker {
  private readonly demandBySymbol = new Map<StockSymbol, number>()

  constructor(private readonly external: ExternalService) {
    super()
  }

  watch(requestedSymbols: readonly StockSymbol[]): Observable<RealtimeEvent> {
    const symbols = new Set(requestedSymbols)

    return merge(this.connectionEvents(symbols), this.tradeEvents(symbols))
  }

  private connectionEvents(
    symbols: ReadonlySet<StockSymbol>
  ): Observable<RealtimeEvent> {
    return this.external.tradeStreamState().pipe(
      scan<ExternalStreamState, ConnectionEvents>(
        (previous, state) => translateState(previous, state, symbols),
        { disconnected: false, event: null }
      ),
      map(({ event }) => event),
      filter((event): event is RealtimeEvent => event !== null)
    )
  }

  private tradeEvents(
    symbols: ReadonlySet<StockSymbol>
  ): Observable<RealtimeEvent> {
    return new Observable<RealtimeEvent>((subscriber) => {
      const subscriptions = new Subscription()
      subscriptions.add(
        this.external.tradeTicks().subscribe((trade) => {
          if (symbols.has(trade.symbol)) {
            subscriber.next({ type: "trade", trade })
          }
        })
      )

      for (const symbol of symbols) {
        subscriber.next({ type: "subscribed", symbol })
        if (this.retain(symbol)) {
          subscriptions.add(
            from(this.external.subscribeTrades(symbol)).subscribe()
          )
        }
      }

      return () => {
        subscriptions.unsubscribe()
        for (const symbol of symbols) {
          if (this.release(symbol)) {
            this.external.unsubscribeTrades(symbol)
          }
        }
      }
    })
  }

  private retain(symbol: StockSymbol): boolean {
    const demand = this.demandBySymbol.get(symbol) ?? 0
    this.demandBySymbol.set(symbol, demand + 1)
    return demand === 0
  }

  private release(symbol: StockSymbol): boolean {
    const demand = this.demandBySymbol.get(symbol)
    if (!demand) {
      return false
    }

    if (demand === 1) {
      this.demandBySymbol.delete(symbol)
      return true
    }

    this.demandBySymbol.set(symbol, demand - 1)
    return false
  }
}

function translateState(
  previous: ConnectionEvents,
  state: ExternalStreamState,
  symbols: ReadonlySet<StockSymbol>
): ConnectionEvents {
  switch (state.status) {
    case "connected":
      return {
        disconnected: false,
        event: previous.disconnected
          ? {
              type: "reconnected",
              provider: state.provider,
              symbols: [...symbols].sort(),
            }
          : null,
      }
    case "disconnected":
      return {
        disconnected: true,
        event: {
          type: "disconnected",
          provider: state.provider,
          closeCode: state.closeCode,
          reason: state.reason,
        },
      }
    case "unavailable":
      return {
        disconnected: previous.disconnected,
        event: {
          type: "unavailable",
          provider: state.provider,
          message: state.message,
          retryAfterMs: state.retryAfterMs,
        },
      }
  }
}
