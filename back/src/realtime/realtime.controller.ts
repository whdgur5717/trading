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
import { apiErrorMapper } from "../common/error/mapper"
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
                          status: { type: "number", enum: [400] },
                          code: { type: "string", enum: ["invalid-request"] },
                          message: { type: "string" },
                          details: {},
                        },
                        required: ["status", "code", "message"],
                      },
                      {
                        type: "object",
                        properties: {
                          status: { type: "number", enum: [404] },
                          code: { type: "string", enum: ["unsupported-stock"] },
                          message: { type: "string" },
                          details: {},
                        },
                        required: ["status", "code", "message"],
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
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["success", "error"],
          properties: {
            success: { type: "boolean", enum: [false] },
            error: {
              type: "object",
              required: ["status", "code", "message"],
              properties: {
                status: { type: "number", enum: [400] },
                code: { type: "string", enum: ["invalid-request"] },
                message: { type: "string" },
                details: {},
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
            data: apiErrorBody(apiErrorMapper.toApiError(error)),
          })
      )
  }
}
