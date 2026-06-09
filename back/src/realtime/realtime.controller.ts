import { Controller, Query, Sse } from "@nestjs/common"
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiProduces,
  getSchemaPath,
} from "@nestjs/swagger"
import { SkipApiResponse } from "../common/api/response"
import { StocksService } from "../stocks/stocks.service"
import {
  RealtimeDisconnectedDto,
  RealtimeErrorDto,
  RealtimeHeartbeatDto,
  RealtimePriceDto,
  RealtimeReconnectedDto,
  RealtimeSubscribedDto,
  StreamQueryDto,
} from "./realtime.dto"
import { RealtimeService } from "./realtime.service"
import { normalizeRealtimeStockCodes } from "./realtime.validation"

@Controller("realtime")
export class RealtimeController {
  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly stocksService: StocksService
  ) {}

  @Sse("stream")
  @SkipApiResponse()
  @ApiProduces("text/event-stream")
  @ApiExtraModels(
    RealtimeDisconnectedDto,
    RealtimeErrorDto,
    RealtimeHeartbeatDto,
    RealtimePriceDto,
    RealtimeReconnectedDto,
    RealtimeSubscribedDto
  )
  @ApiOkResponse({
    description: "Server-sent events stream",
    content: {
      "text/event-stream": {
        schema: {
          type: "array",
          items: {
            oneOf: [
              {
                type: "object",
                properties: {
                  event: { type: "string", enum: ["subscribed"] },
                  id: { type: "string" },
                  data: { $ref: getSchemaPath(RealtimeSubscribedDto) },
                },
                required: ["event", "data"],
              },
              {
                type: "object",
                properties: {
                  event: { type: "string", enum: ["price"] },
                  id: { type: "string" },
                  data: { $ref: getSchemaPath(RealtimePriceDto) },
                },
                required: ["event", "data"],
              },
              {
                type: "object",
                properties: {
                  event: { type: "string", enum: ["heartbeat"] },
                  id: { type: "string" },
                  data: { $ref: getSchemaPath(RealtimeHeartbeatDto) },
                },
                required: ["event", "data"],
              },
              {
                type: "object",
                properties: {
                  event: { type: "string", enum: ["disconnected"] },
                  id: { type: "string" },
                  data: { $ref: getSchemaPath(RealtimeDisconnectedDto) },
                },
                required: ["event", "data"],
              },
              {
                type: "object",
                properties: {
                  event: { type: "string", enum: ["reconnected"] },
                  id: { type: "string" },
                  data: { $ref: getSchemaPath(RealtimeReconnectedDto) },
                },
                required: ["event", "data"],
              },
              {
                type: "object",
                properties: {
                  event: { type: "string", enum: ["error"] },
                  id: { type: "string" },
                  retry: { type: "number" },
                  data: {
                    oneOf: [
                      { $ref: getSchemaPath(RealtimeErrorDto) },
                      { type: "string" },
                    ],
                  },
                },
                required: ["event", "data"],
              },
            ],
          },
        },
      },
    },
  })
  stream(@Query() query: StreamQueryDto) {
    const normalizedStockCodes = normalizeRealtimeStockCodes(query.stockCodes)

    for (const stockCode of normalizedStockCodes) {
      this.stocksService.getByCode(stockCode)
    }

    return this.realtimeService.stream(normalizedStockCodes)
  }
}
