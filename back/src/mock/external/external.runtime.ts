import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import type { WebSocketLink } from "msw"
import { setupServer, type SetupServer } from "msw/node"
import type { AppEnv } from "../../config/env.validation"
import { restHandlers } from "./rest/handlers"
import { createKisWebSocketHandler } from "./websocket/kis.handler"

@Injectable()
export class ExternalRuntime implements OnModuleInit, OnModuleDestroy {
  private server: SetupServer | undefined
  private webSocket: WebSocketLink | undefined

  constructor(private readonly config: ConfigService<AppEnv, true>) {}

  onModuleInit(): void {
    try {
      const webSocket = createKisWebSocketHandler(this.config)

      this.webSocket = webSocket.link
      this.server = setupServer(...restHandlers(), webSocket.handler)
      this.server.listen({
        onUnhandledRequest(request, print) {
          const hostname = new URL(request.url).hostname

          if (hostname === "127.0.0.1" || hostname === "localhost") {
            return
          }

          print.error()
        },
      })
      this.server.events.on("request:start", ({ request }) => {
        console.log(`[MSW] ${request.method} ${request.url}`)
      })
      this.server.events.on("request:match", ({ request }) => {
        console.log(`[MSW] matched ${request.method} ${request.url}`)
      })

      console.log("External API mocks are active")
    } catch (error) {
      this.close()
      throw error
    }
  }

  reset(): void {
    this.server?.resetHandlers()

    for (const client of this.webSocket?.clients ?? []) {
      client.close()
    }
  }

  onModuleDestroy(): void {
    this.close()
  }

  private close(): void {
    for (const client of this.webSocket?.clients ?? []) {
      client.close()
    }

    this.server?.close()
    this.server = undefined
    this.webSocket = undefined
  }
}
