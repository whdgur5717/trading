import { Controller, Query, Sse } from "@nestjs/common"
import type { MessageEvent } from "@nestjs/common"
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiProduces,
  getSchemaPath,
} from "@nestjs/swagger"
import { Result } from "neverthrow"
import { of, type Observable } from "rxjs"
import { apiErrorBody, SkipApiResponse } from "../common/api/response"
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
import { parseRealtimeSymbols } from "./realtime.validation"

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
                              issues: {
                                type: "array",
                                items: {},
                              },
                            },
                            required: ["issues"],
                          },
                        },
                        required: ["type", "status", "message", "data"],
                      },
                      {
                        type: "object",
                        properties: {
                          type: { type: "string", enum: ["stock.unsupported"] },
                          status: { type: "number", enum: [404] },
                          message: { type: "string" },
                          data: {
                            type: "object",
                            properties: {
                              symbol: { type: "string" },
                            },
                            required: ["symbol"],
                          },
                        },
                        required: ["type", "status", "message", "data"],
                      },
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
  @ApiBadRequestResponse({
    description:
      "The symbols query is missing or does not match the stream request contract.",
    example: {
      success: false,
      error: {
        type: "common.invalid_request",
        status: 400,
        message: "Validation failed",
        data: {
          issues: [{ path: ["symbols"], message: "Required" }],
        },
      },
    },
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["success", "error"],
          properties: {
            success: { type: "boolean", enum: [false] },
            error: {
              type: "object",
              required: ["type", "status", "message", "data"],
              properties: {
                type: { type: "string", enum: ["common.invalid_request"] },
                status: { type: "number", enum: [400] },
                message: { type: "string" },
                data: {
                  type: "object",
                  properties: {
                    issues: {
                      type: "array",
                      items: {},
                    },
                  },
                  required: ["issues"],
                },
              },
            },
          },
        },
      },
    },
  })
  stream(@Query() query: StreamQueryDto): Observable<MessageEvent> {
    return parseRealtimeSymbols(query.symbols)
      .andThen((symbols) =>
        Result.combine(
          symbols.map((symbol) =>
            this.stocksService.getBySymbol(symbol).map(() => symbol)
          )
        )
      )
      .match(
        (symbols) => this.realtimeService.stream(symbols),
        (error) =>
          of({
            type: "error",
            data: apiErrorBody(error),
          })
      )
  }
}
