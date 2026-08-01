import {
  Injectable,
  Module,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import type { SetupServer } from "msw/node"
import { createExternalServer } from "../../../test/support/external/server"
import { Server as KisWebSocketMockServer } from "../../../test/support/external/kis/websocket/server"

@Injectable()
export class ExternalMockRuntime implements OnModuleInit, OnModuleDestroy {
  private readonly websocket = new KisWebSocketMockServer()
  private server: SetupServer | undefined

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.websocket.listen()
      this.config.set("KIS_WS_URL", this.websocket.url)

      this.server = createExternalServer({
        kisRestBaseUrl: this.config.getOrThrow<string>("KIS_REST_BASE_URL"),
      })
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

      console.log("External REST API mocks are active")
      console.log(`KIS WebSocket mock listening at ${this.websocket.url}`)
    } catch (error) {
      this.server?.close()
      this.server = undefined
      this.websocket.close()
      throw error
    }
  }

  reset(): void {
    this.server?.resetHandlers()
    this.websocket.reset()
  }

  onModuleDestroy(): void {
    this.server?.close()
    this.websocket.close()
  }
}

@Module({
  providers: [ExternalMockRuntime],
  exports: [ExternalMockRuntime],
})
export class ExternalMockModule {}
