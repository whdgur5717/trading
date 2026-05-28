import { z } from "zod"

export const StockDtoSchema = z.object({
  code: z.string().regex(new RegExp("^\\d{6}$")),
  name: z.string(),
  marketName: z.string(),
  kisMarketCode: z.enum(["J", "NX", "UN"]),
})
export type StockDto = z.infer<typeof StockDtoSchema>

export const StockCurrentDtoSchema = z.object({
  stock: z.object({
    code: z.string().regex(new RegExp("^\\d{6}$")),
    name: z.string(),
    marketName: z.string(),
    kisMarketCode: z.enum(["J", "NX", "UN"]),
  }),
  marketCode: z.enum(["J", "NX", "UN"]),
  price: z.object({
    currentPrice: z.number(),
    openPrice: z.number(),
    highPrice: z.number(),
    lowPrice: z.number(),
    accumulatedVolume: z.number(),
    previousDayChange: z.number(),
    previousDayChangeRate: z.number(),
  }),
})
export type StockCurrentDto = z.infer<typeof StockCurrentDtoSchema>

export const StockHistoryDtoSchema = z.object({
  stock: z.object({
    code: z.string().regex(new RegExp("^\\d{6}$")),
    name: z.string(),
    marketName: z.string(),
    kisMarketCode: z.enum(["J", "NX", "UN"]),
  }),
  requestedDate: z.string(),
  marketCode: z.enum(["J", "NX", "UN"]),
  isTradingDay: z.boolean(),
  candle: z.union([
    z.object({
      date: z.string(),
      openPrice: z.number(),
      highPrice: z.number(),
      lowPrice: z.number(),
      closePrice: z.number(),
      accumulatedVolume: z.number(),
    }),
    z.null(),
  ]),
})
export type StockHistoryDto = z.infer<typeof StockHistoryDtoSchema>

export const ReturnSummaryDtoSchema = z.object({
  stock: z.object({
    code: z.string().regex(new RegExp("^\\d{6}$")),
    name: z.string(),
    marketName: z.string(),
    kisMarketCode: z.enum(["J", "NX", "UN"]),
  }),
  buy: z.object({
    date: z.string(),
    price: z.number(),
    priceType: z.literal("adjusted-close"),
    quantity: z.number(),
  }),
  current: z.object({
    price: z.number(),
    source: z.literal("kis-rest-current-price"),
    marketCode: z.enum(["J", "NX", "UN"]),
  }),
  result: z.object({
    buyAmount: z.number(),
    currentValue: z.number(),
    profit: z.number(),
    profitRate: z.number(),
  }),
})
export type ReturnSummaryDto = z.infer<typeof ReturnSummaryDtoSchema>

export const RealtimeDisconnectedDtoSchema = z.object({
  closeCode: z.number(),
  reason: z.string(),
})
export type RealtimeDisconnectedDto = z.infer<
  typeof RealtimeDisconnectedDtoSchema
>

export const RealtimeErrorDtoSchema = z.object({
  code: z.string(),
  message: z.string(),
  retryAfterMs: z.number().optional(),
})
export type RealtimeErrorDto = z.infer<typeof RealtimeErrorDtoSchema>

export const RealtimeHeartbeatDtoSchema = z.object({
  at: z.string(),
})
export type RealtimeHeartbeatDto = z.infer<typeof RealtimeHeartbeatDtoSchema>

export const RealtimePriceDtoSchema = z.object({
  stockCode: z.string(),
  trId: z.string(),
  price: z.number(),
  tradeTime: z.string(),
  businessDate: z.string(),
})
export type RealtimePriceDto = z.infer<typeof RealtimePriceDtoSchema>

export const RealtimeReconnectedDtoSchema = z.object({
  stockCodes: z.array(z.string()),
})
export type RealtimeReconnectedDto = z.infer<
  typeof RealtimeReconnectedDtoSchema
>

export const RealtimeSubscribedDtoSchema = z.object({
  stockCode: z.string(),
})
export type RealtimeSubscribedDto = z.infer<typeof RealtimeSubscribedDtoSchema>

export const HealthCheckDtoSchema = z.object({
  status: z.literal("ok"),
})
export type HealthCheckDto = z.infer<typeof HealthCheckDtoSchema>

export const ApiSuccessDtoSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
  meta: z.record(z.string(), z.unknown()).optional(),
})
export type ApiSuccessDto = z.infer<typeof ApiSuccessDtoSchema>

export const ApiErrorDtoSchema = z.object({
  success: z.literal(false),
  error: z.object({
    status: z.union([
      z.literal(400),
      z.literal(401),
      z.literal(403),
      z.literal(404),
      z.literal(405),
      z.literal(408),
      z.literal(409),
      z.literal(412),
      z.literal(413),
      z.literal(422),
      z.literal(429),
      z.literal(499),
      z.literal(500),
      z.literal(502),
      z.literal(503),
      z.literal(504),
    ]),
    code: z.enum([
      "BAD_REQUEST",
      "UNAUTHORIZED",
      "FORBIDDEN",
      "NOT_FOUND",
      "METHOD_NOT_SUPPORTED",
      "TIMEOUT",
      "CONFLICT",
      "PRECONDITION_FAILED",
      "PAYLOAD_TOO_LARGE",
      "UNPROCESSABLE_CONTENT",
      "TOO_MANY_REQUESTS",
      "CLIENT_CLOSED_REQUEST",
      "INTERNAL_SERVER_ERROR",
      "BAD_GATEWAY",
      "SERVICE_UNAVAILABLE",
      "GATEWAY_TIMEOUT",
    ]),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})
export type ApiErrorDto = z.infer<typeof ApiErrorDtoSchema>

export const StocksControllerSearchResponseSchema = ApiSuccessDtoSchema.omit({
  data: true,
}).extend({
  data: z.array(StockDtoSchema),
})
export type StocksControllerSearchResponse = z.infer<
  typeof StocksControllerSearchResponseSchema
>

export const StocksControllerCurrentResponseSchema = ApiSuccessDtoSchema.omit({
  data: true,
}).extend({
  data: StockCurrentDtoSchema,
})
export type StocksControllerCurrentResponse = z.infer<
  typeof StocksControllerCurrentResponseSchema
>

export const StocksControllerHistoryResponseSchema = ApiSuccessDtoSchema.omit({
  data: true,
}).extend({
  data: StockHistoryDtoSchema,
})
export type StocksControllerHistoryResponse = z.infer<
  typeof StocksControllerHistoryResponseSchema
>

export const ReturnsControllerCalculateResponseSchema =
  ApiSuccessDtoSchema.omit({ data: true }).extend({
    data: ReturnSummaryDtoSchema,
  })
export type ReturnsControllerCalculateResponse = z.infer<
  typeof ReturnsControllerCalculateResponseSchema
>

export const RealtimeControllerStreamEventSchema = z.union([
  z.object({
    event: z.literal("subscribed"),
    id: z.string().optional(),
    data: RealtimeSubscribedDtoSchema,
  }),
  z.object({
    event: z.literal("price"),
    id: z.string().optional(),
    data: RealtimePriceDtoSchema,
  }),
  z.object({
    event: z.literal("heartbeat"),
    id: z.string().optional(),
    data: RealtimeHeartbeatDtoSchema,
  }),
  z.object({
    event: z.literal("disconnected"),
    id: z.string().optional(),
    data: RealtimeDisconnectedDtoSchema,
  }),
  z.object({
    event: z.literal("reconnected"),
    id: z.string().optional(),
    data: RealtimeReconnectedDtoSchema,
  }),
  z.object({
    event: z.literal("error"),
    id: z.string().optional(),
    retry: z.number().optional(),
    data: z.union([RealtimeErrorDtoSchema, z.string()]),
  }),
])
export type RealtimeControllerStreamEvent = z.infer<
  typeof RealtimeControllerStreamEventSchema
>

export const HealthControllerCheckResponseSchema = ApiSuccessDtoSchema.omit({
  data: true,
}).extend({
  data: HealthCheckDtoSchema,
})
export type HealthControllerCheckResponse = z.infer<
  typeof HealthControllerCheckResponseSchema
>
