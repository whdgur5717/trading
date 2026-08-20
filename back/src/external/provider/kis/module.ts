import { Module } from "@nestjs/common"
import { HttpRequestModule } from "../../../common/http/httpRequest.module"
import { KisAuthorization } from "./authorization"
import { KisRestClient } from "./rest/client"
import { KisRestQueue } from "./rest/queue"
import { KisRestRequest } from "./rest/request"
import { KisWebSocketClient } from "./websocket/client"
import { KisWebSocketConnection } from "./websocket/connection"
import { KisTradeClient } from "./websocket/trade/client"

@Module({
  imports: [HttpRequestModule],
  providers: [
    KisAuthorization,
    KisRestQueue,
    KisRestRequest,
    KisRestClient,
    KisWebSocketConnection,
    KisWebSocketClient,
    KisTradeClient,
  ],
  exports: [KisRestClient, KisTradeClient],
})
export class KisModule {}
