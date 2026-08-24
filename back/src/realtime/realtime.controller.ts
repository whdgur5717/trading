import { Controller, Query, Sse } from "@nestjs/common"
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  getSchemaPath,
} from "@nestjs/swagger"
import { Result } from "neverthrow"
import type { Observable } from "rxjs"
import { definedErrorException } from "../common/error/define"
import { StocksService } from "../stocks/stocks.service"
import {
  DisconnectedEventDto,
  HeartbeatEventDto,
  MarketEventDto,
  PriceEventDto,
  RealtimeErrorEventDto,
  ReconnectedEventDto,
  StreamQueryDto,
  SubscribedEventDto,
} from "./realtime.dto"
import { RealtimeService } from "./realtime.service"
import { toServerSentEvents, type RealtimeSseEvent } from "./realtime.sse"
import { parseRequestedSymbols } from "./realtime.validation"

@Controller("realtime")
export class RealtimeController {
  constructor(
    private realtime: RealtimeService,
    private stocks: StocksService
  ) {}

  @Sse("stream")
  @ApiOperation({ operationId: "streamRealtimePrices" })
  @ApiProduces("text/event-stream")
  @ApiExtraModels(
    SubscribedEventDto,
    PriceEventDto,
    MarketEventDto,
    HeartbeatEventDto,
    DisconnectedEventDto,
    ReconnectedEventDto,
    RealtimeErrorEventDto
  )
  @ApiOkResponse({
    description: "Realtime stock trade events",
    content: {
      "text/event-stream": {
        schema: {
          type: "array",
          items: {
            oneOf: [
              ...(
                [
                  ["subscribed", SubscribedEventDto],
                  ["price", PriceEventDto],
                  ["market", MarketEventDto],
                  ["heartbeat", HeartbeatEventDto],
                  ["disconnected", DisconnectedEventDto],
                  ["reconnected", ReconnectedEventDto],
                ] as const
              ).map(([event, model]) => ({
                type: "object" as const,
                properties: {
                  event: { type: "string" as const, enum: [event] },
                  id: { type: "string" as const },
                  data: { $ref: getSchemaPath(model) },
                },
                required: ["event", "data"],
              })),
              {
                type: "object",
                properties: {
                  event: { type: "string", enum: ["realtime-error"] },
                  id: { type: "string" },
                  retry: { type: "number" },
                  data: { $ref: getSchemaPath(RealtimeErrorEventDto) },
                },
                required: ["event", "data"],
              },
            ],
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid symbols query",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            success: { type: "boolean", enum: [false] },
            error: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["common.invalid_request"] },
                status: { type: "number", enum: [400] },
                message: { type: "string" },
                data: {
                  type: "object",
                  properties: {
                    issues: { type: "array", items: {} },
                  },
                  required: ["issues"],
                },
              },
              required: ["type", "status", "message", "data"],
            },
          },
          required: ["success", "error"],
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Unsupported stock symbol",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            success: { type: "boolean", enum: [false] },
            error: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["stock.unsupported"] },
                status: { type: "number", enum: [404] },
                message: { type: "string" },
                data: {
                  type: "object",
                  properties: { symbol: { type: "string" } },
                  required: ["symbol"],
                },
              },
              required: ["type", "status", "message", "data"],
            },
          },
          required: ["success", "error"],
        },
      },
    },
  })
  stream(
    @Query() query: StreamQueryDto
  ): Promise<Observable<RealtimeSseEvent>> {
    return parseRequestedSymbols(query.symbols)
      .andThen((symbols) =>
        Result.combine(
          symbols.map((symbol) =>
            this.stocks.getBySymbol(symbol).map(() => symbol)
          )
        )
      )
      .match(
        (symbols) =>
          Promise.resolve(toServerSentEvents(this.realtime.watch(symbols))),
        (error) => Promise.reject(definedErrorException(error))
      )
  }
}
