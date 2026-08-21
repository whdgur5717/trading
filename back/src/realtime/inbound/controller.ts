import { Controller, Query, Sse, type MessageEvent } from "@nestjs/common"
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
import { definedErrorException } from "../../common/error/define"
import { StocksService } from "../../stocks/stocks.service"
import { RealtimeService } from "../realtime.service"
import {
  DisconnectedEventDto,
  HeartbeatEventDto,
  PriceEventDto,
  ReconnectedEventDto,
  StreamQueryDto,
  SubscribedEventDto,
  UnavailableEventDto,
} from "./dto"
import { toServerSentEvents } from "./sse"
import { parseRequestedSymbols } from "./validation"

@Controller("realtime")
export class RealtimeController {
  constructor(
    private readonly realtime: RealtimeService,
    private readonly stocks: StocksService
  ) {}

  @Sse("stream")
  @ApiOperation({ operationId: "streamRealtimePrices" })
  @ApiProduces("text/event-stream")
  @ApiExtraModels(
    SubscribedEventDto,
    PriceEventDto,
    HeartbeatEventDto,
    DisconnectedEventDto,
    ReconnectedEventDto,
    UnavailableEventDto
  )
  // 일반 HTTP API 응답 계약은 custom TypeScript transformer인
  // `openapi-contract.plugin.js`가 OpenAPI에 자동 생성하지만, `@Sse()` route는
  // transformer 대상이 아니므로 응답 계약은 현재 임시로 직접 선언한다.
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
                  event: { type: "string", enum: ["error"] },
                  id: { type: "string" },
                  retry: { type: "number" },
                  data: { $ref: getSchemaPath(UnavailableEventDto) },
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
                type: {
                  type: "string",
                  enum: ["common.invalid_request"],
                },
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
  stream(@Query() query: StreamQueryDto): Promise<Observable<MessageEvent>> {
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
