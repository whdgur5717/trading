import type { ConfigService } from "@nestjs/config"
import { ws, type WebSocketHandler, type WebSocketLink } from "msw"
import type { AppEnv } from "../../../config/env.validation"
import { realtimeAckOutput, realtimeTradeMessages } from "./kis.samples"

const SUBSCRIBE = "1"
const UNSUBSCRIBE = "2"
const REALTIME_PUSH_INTERVAL_MS = 1_000

interface KisWebSocketHandler {
  readonly handler: WebSocketHandler
  readonly link: WebSocketLink
}

function ack(params: { trId: string; trKey: string; message: string }): string {
  return JSON.stringify({
    header: {
      tr_id: params.trId,
      tr_key: params.trKey,
      encrypt: "N",
    },
    body: {
      rt_cd: "0",
      msg_cd: "OPSP0000",
      msg1: params.message,
      output: realtimeAckOutput,
    },
  })
}

export function createKisWebSocketHandler(
  config: ConfigService<AppEnv, true>
): KisWebSocketHandler {
  const kisWebSocket = ws.link(config.getOrThrow<string>("KIS_WS_URL"))
  const handler = kisWebSocket.addEventListener("connection", ({ client }) => {
    const subscriptions = new Map<string, ReturnType<typeof setInterval>>()

    client.addEventListener("message", (event) => {
      if (typeof event.data !== "string") {
        return
      }

      const request = JSON.parse(event.data) as {
        header?: { tr_type?: string }
        body?: { input?: { tr_id?: string; tr_key?: string } }
      }
      const trType = request.header?.tr_type
      const trId = request.body?.input?.tr_id
      const trKey = request.body?.input?.tr_key

      if (!trId || !trKey) {
        return
      }

      const subscriptionKey = `${trId}:${trKey}`

      if (trType === SUBSCRIBE) {
        client.send(ack({ message: "SUBSCRIBE SUCCESS", trId, trKey }))

        if (
          trId !== "H0UNCNT0" ||
          trKey !== "005930" ||
          subscriptions.has(subscriptionKey)
        ) {
          return
        }

        const sendTrade = () => {
          client.send(
            realtimeTradeMessages[
              Math.floor(Math.random() * realtimeTradeMessages.length)
            ]
          )
        }

        sendTrade()
        subscriptions.set(
          subscriptionKey,
          setInterval(sendTrade, REALTIME_PUSH_INTERVAL_MS)
        )
        return
      }

      if (trType === UNSUBSCRIBE) {
        const timer = subscriptions.get(subscriptionKey)

        if (timer) {
          clearInterval(timer)
          subscriptions.delete(subscriptionKey)
        }

        client.send(ack({ message: "UNSUBSCRIBE SUCCESS", trId, trKey }))
      }
    })

    client.addEventListener("close", () => {
      for (const timer of subscriptions.values()) {
        clearInterval(timer)
      }
    })
  })

  return {
    handler,
    link: kisWebSocket,
  }
}
