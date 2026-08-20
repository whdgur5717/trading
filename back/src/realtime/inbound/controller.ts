import { Controller, Query, Sse, type MessageEvent } from "@nestjs/common"
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  getSchemaPath,
} from "@nestjs/swagger"
import { Result } from "neverthrow"
import { of, type Observable } from "rxjs"
import { apiErrorBody, SkipApiResponse } from "../../common/api/response"
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
  @SkipApiResponse()
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
                  data: {
                    oneOf: [
                      {
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
                      {
                        type: "object",
                        properties: {
                          type: {
                            type: "string",
                            enum: ["stock.unsupported"],
                          },
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
                      { $ref: getSchemaPath(UnavailableEventDto) },
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
  @ApiBadRequestResponse({ description: "Invalid symbols query" })
  stream(@Query() query: StreamQueryDto): Observable<MessageEvent> {
    return parseRequestedSymbols(query.symbols)
      .andThen((symbols) =>
        Result.combine(
          symbols.map((symbol) =>
            this.stocks.getBySymbol(symbol).map(() => symbol)
          )
        )
      )
      .match(
        (symbols) => toServerSentEvents(this.realtime.watch(symbols)),
        (error) => of({ type: "error", data: apiErrorBody(error) })
      )
  }
}
