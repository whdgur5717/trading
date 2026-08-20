import type { KisWebSocketFrame } from "./schema"

export type KisWebSocketSubscription = {
  readonly trId: string
  readonly trKey: string
}

export interface KisWebSocketChannel<Input, Event> {
  subscription(input: Input): KisWebSocketSubscription
  accepts(frame: KisWebSocketFrame): boolean
  decode(frame: KisWebSocketFrame): Event | null
}

export function subscriptionKey(
  subscription: KisWebSocketSubscription
): string {
  return `${subscription.trId}:${subscription.trKey}`
}
