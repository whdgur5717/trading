import { EventEmitter, once } from "node:events"
import type { AddressInfo } from "node:net"
import { createWebSocketStream, WebSocket, WebSocketServer } from "ws"
import { realtimeAckOutput, realtimeTradeMessages } from "./samples"

const SUBSCRIBE = "1"
const UNSUBSCRIBE = "2"
const REALTIME_PUSH_INTERVAL_MS = 1_000

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

export class Server {
  private readonly messages: string[] = []
  private readonly messageEvents = new EventEmitter()
  private readonly server = new WebSocketServer({
    host: "127.0.0.1",
    port: 0,
  })
  private readonly listening = once(this.server, "listening")
  private readonly sockets = new Set<WebSocket>()
  private readonly subscriptions = new Map<
    WebSocket,
    Map<string, ReturnType<typeof setInterval>>
  >()

  constructor() {
    this.server.on("connection", this.handleConnection)
  }

  get url(): string {
    const address = this.server.address() as AddressInfo | null

    if (!address) {
      throw new Error("KIS WebSocket mock server is not listening")
    }

    return `ws://127.0.0.1:${address.port}`
  }

  async listen(): Promise<void> {
    await this.listening
  }

  async receive(): Promise<string | undefined> {
    if (this.messages.length === 0) {
      await once(this.messageEvents, "message")
    }

    return this.messages.shift()
  }

  send(message: string): void {
    for (const socket of this.sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message)
      }
    }
  }

  close(): void {
    for (const socket of this.sockets) {
      socket.close()
    }

    for (const timers of this.subscriptions.values()) {
      for (const timer of timers.values()) {
        clearInterval(timer)
      }
    }

    this.subscriptions.clear()
    this.server.close()
  }

  private readonly handleConnection = (socket: WebSocket): void => {
    this.sockets.add(socket)
    this.subscriptions.set(socket, new Map())
    const stream = createWebSocketStream(socket)
    stream.setEncoding("utf8")
    stream.on("data", (message: string) => {
      this.handleMessage(socket, message)
    })
    socket.on("close", () => {
      this.clearSocketSubscriptions(socket)
      this.sockets.delete(socket)
    })
  }

  private readonly handleMessage = (
    socket: WebSocket,
    message: string
  ): void => {
    this.messages.push(message)
    this.messageEvents.emit("message")
    const request = JSON.parse(message) as {
      header?: { tr_type?: string }
      body?: { input?: { tr_id?: string; tr_key?: string } }
    }
    const trType = request.header?.tr_type
    const trId = request.body?.input?.tr_id
    const trKey = request.body?.input?.tr_key

    if (!trId || !trKey) {
      return
    }

    if (trType === SUBSCRIBE) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(ack({ message: "SUBSCRIBE SUCCESS", trId, trKey }))
      }

      this.subscribe(socket, trId, trKey)
    }

    if (trType === UNSUBSCRIBE) {
      this.unsubscribe(socket, trId, trKey)

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(ack({ message: "UNSUBSCRIBE SUCCESS", trId, trKey }))
      }
    }
  }

  private subscribe(socket: WebSocket, trId: string, trKey: string): void {
    if (trId !== "H0STCNT0" || trKey !== "005930") {
      return
    }

    const subscriptions = this.subscriptions.get(socket)
    const key = `${trId}:${trKey}`

    if (!subscriptions || subscriptions.has(key)) {
      return
    }

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        realtimeTradeMessages[
          Math.floor(Math.random() * realtimeTradeMessages.length)
        ]
      )
    }

    subscriptions.set(
      key,
      setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(
            realtimeTradeMessages[
              Math.floor(Math.random() * realtimeTradeMessages.length)
            ]
          )
        }
      }, REALTIME_PUSH_INTERVAL_MS)
    )
  }

  private unsubscribe(socket: WebSocket, trId: string, trKey: string): void {
    const subscriptions = this.subscriptions.get(socket)
    const key = `${trId}:${trKey}`
    const timer = subscriptions?.get(key)

    if (!timer) {
      return
    }

    clearInterval(timer)
    subscriptions?.delete(key)
  }

  private clearSocketSubscriptions(socket: WebSocket): void {
    const subscriptions = this.subscriptions.get(socket)

    if (!subscriptions) {
      return
    }

    for (const timer of subscriptions.values()) {
      clearInterval(timer)
    }

    this.subscriptions.delete(socket)
  }
}
