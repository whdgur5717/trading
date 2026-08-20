import { Injectable } from "@nestjs/common"
import type { Observable } from "rxjs"
import type { StockSymbol } from "../external/schema"
import { RealtimeBroker } from "./broker/realtime-broker.contract"
import type { RealtimeEvent } from "./event"

@Injectable()
export class RealtimeService {
  constructor(private readonly broker: RealtimeBroker) {}

  watch(symbols: readonly StockSymbol[]): Observable<RealtimeEvent> {
    return this.broker.watch(symbols)
  }
}
