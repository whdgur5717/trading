import type { Observable } from "rxjs"
import type { StockSymbol } from "../../external/schema"
import type { RealtimeEvent } from "../event"

export abstract class RealtimeBroker {
  abstract watch(symbols: readonly StockSymbol[]): Observable<RealtimeEvent>
}
