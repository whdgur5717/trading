import { z } from "zod"

export const SuggestionDtoSchema = z.object({
  items: z.array(
    z.object({
      code: z.string().regex(new RegExp("^[A-Z0-9]{1,9}$")),
      name: z.string(),
      marketName: z.string(),
      quotationMarket: z.enum(["KRX", "NXT", "CONSOLIDATED"]),
      standardCode: z.string().optional(),
      securityGroupCode: z.string().optional(),
      rawEtpType: z.union([z.string(), z.null()]).optional(),
      preferredStockType: z.union([z.string(), z.null()]).optional(),
      productType: z
        .enum([
          "STOCK",
          "PREFERRED",
          "ETF",
          "ETN",
          "REIT",
          "BENEFICIARY_CERTIFICATE",
          "SPAC",
          "OTHER",
        ])
        .optional(),
      isPreferred: z.boolean().optional(),
      isEtf: z.boolean().optional(),
      isEtn: z.boolean().optional(),
      isSpac: z.boolean().optional(),
      isReit: z.boolean().optional(),
      isTradingHalted: z.boolean().optional(),
      isUnderAdministration: z.boolean().optional(),
      isLowLiquidity: z.boolean().optional(),
      marketCap: z
        .union([z.number().int().min(0).max(9007199254740991), z.null()])
        .optional(),
      previousVolume: z
        .union([z.number().int().min(0).max(9007199254740991), z.null()])
        .optional(),
      listedDate: z
        .union([z.string().regex(new RegExp("^\\d{8}$")), z.null()])
        .optional(),
      isKospi100: z.boolean().optional(),
      isKospi50: z.boolean().optional(),
      isKrx300: z.boolean().optional(),
      warningLevel: z.union([z.string(), z.null()]).optional(),
    })
  ),
  hasMore: z.boolean(),
})
export type SuggestionDto = z.infer<typeof SuggestionDtoSchema>

export const StockDtoSchema = z.object({
  code: z.string().regex(new RegExp("^[A-Z0-9]{1,9}$")),
  name: z.string(),
  marketName: z.string(),
  quotationMarket: z.enum(["KRX", "NXT", "CONSOLIDATED"]),
  standardCode: z.string().optional(),
  securityGroupCode: z.string().optional(),
  rawEtpType: z.union([z.string(), z.null()]).optional(),
  preferredStockType: z.union([z.string(), z.null()]).optional(),
  productType: z
    .enum([
      "STOCK",
      "PREFERRED",
      "ETF",
      "ETN",
      "REIT",
      "BENEFICIARY_CERTIFICATE",
      "SPAC",
      "OTHER",
    ])
    .optional(),
  isPreferred: z.boolean().optional(),
  isEtf: z.boolean().optional(),
  isEtn: z.boolean().optional(),
  isSpac: z.boolean().optional(),
  isReit: z.boolean().optional(),
  isTradingHalted: z.boolean().optional(),
  isUnderAdministration: z.boolean().optional(),
  isLowLiquidity: z.boolean().optional(),
  marketCap: z
    .union([z.number().int().min(0).max(9007199254740991), z.null()])
    .optional(),
  previousVolume: z
    .union([z.number().int().min(0).max(9007199254740991), z.null()])
    .optional(),
  listedDate: z
    .union([z.string().regex(new RegExp("^\\d{8}$")), z.null()])
    .optional(),
  isKospi100: z.boolean().optional(),
  isKospi50: z.boolean().optional(),
  isKrx300: z.boolean().optional(),
  warningLevel: z.union([z.string(), z.null()]).optional(),
})
export type StockDto = z.infer<typeof StockDtoSchema>

export const PriceCurrentDtoSchema = z.object({
  price: z.number(),
  source: z.enum(["stock-quote", "daily-candle"]),
  quotationMarket: z.literal("CONSOLIDATED"),
  basis: z.union([
    z.object({
      type: z.literal("current-snapshot"),
      requestedAt: z.string(),
    }),
    z.object({
      type: z.literal("latest-close"),
      tradingDate: z.string(),
    }),
  ]),
})
export type PriceCurrentDto = z.infer<typeof PriceCurrentDtoSchema>

export const PriceQuoteDtoSchema = z.object({
  stock: z.object({
    code: z.string().regex(new RegExp("^[A-Z0-9]{1,9}$")),
    name: z.string(),
    marketName: z.string(),
    quotationMarket: z.enum(["KRX", "NXT", "CONSOLIDATED"]),
    standardCode: z.string().optional(),
    securityGroupCode: z.string().optional(),
    rawEtpType: z.union([z.string(), z.null()]).optional(),
    preferredStockType: z.union([z.string(), z.null()]).optional(),
    productType: z
      .enum([
        "STOCK",
        "PREFERRED",
        "ETF",
        "ETN",
        "REIT",
        "BENEFICIARY_CERTIFICATE",
        "SPAC",
        "OTHER",
      ])
      .optional(),
    isPreferred: z.boolean().optional(),
    isEtf: z.boolean().optional(),
    isEtn: z.boolean().optional(),
    isSpac: z.boolean().optional(),
    isReit: z.boolean().optional(),
    isTradingHalted: z.boolean().optional(),
    isUnderAdministration: z.boolean().optional(),
    isLowLiquidity: z.boolean().optional(),
    marketCap: z
      .union([z.number().int().min(0).max(9007199254740991), z.null()])
      .optional(),
    previousVolume: z
      .union([z.number().int().min(0).max(9007199254740991), z.null()])
      .optional(),
    listedDate: z
      .union([z.string().regex(new RegExp("^\\d{8}$")), z.null()])
      .optional(),
    isKospi100: z.boolean().optional(),
    isKospi50: z.boolean().optional(),
    isKrx300: z.boolean().optional(),
    warningLevel: z.union([z.string(), z.null()]).optional(),
  }),
  quotationMarket: z.enum(["KRX", "NXT", "CONSOLIDATED"]),
  price: z.object({
    currentPrice: z.number().min(0),
    openPrice: z.number().min(0),
    highPrice: z.number().min(0),
    lowPrice: z.number().min(0),
    accumulatedVolume: z.number().int().min(0).max(9007199254740991),
    previousDayChange: z.number(),
    previousDayChangeRate: z.number(),
  }),
})
export type PriceQuoteDto = z.infer<typeof PriceQuoteDtoSchema>

export const PriceDailyCandleDtoSchema = z.object({
  stock: z.object({
    code: z.string().regex(new RegExp("^[A-Z0-9]{1,9}$")),
    name: z.string(),
    marketName: z.string(),
    quotationMarket: z.enum(["KRX", "NXT", "CONSOLIDATED"]),
    standardCode: z.string().optional(),
    securityGroupCode: z.string().optional(),
    rawEtpType: z.union([z.string(), z.null()]).optional(),
    preferredStockType: z.union([z.string(), z.null()]).optional(),
    productType: z
      .enum([
        "STOCK",
        "PREFERRED",
        "ETF",
        "ETN",
        "REIT",
        "BENEFICIARY_CERTIFICATE",
        "SPAC",
        "OTHER",
      ])
      .optional(),
    isPreferred: z.boolean().optional(),
    isEtf: z.boolean().optional(),
    isEtn: z.boolean().optional(),
    isSpac: z.boolean().optional(),
    isReit: z.boolean().optional(),
    isTradingHalted: z.boolean().optional(),
    isUnderAdministration: z.boolean().optional(),
    isLowLiquidity: z.boolean().optional(),
    marketCap: z
      .union([z.number().int().min(0).max(9007199254740991), z.null()])
      .optional(),
    previousVolume: z
      .union([z.number().int().min(0).max(9007199254740991), z.null()])
      .optional(),
    listedDate: z
      .union([z.string().regex(new RegExp("^\\d{8}$")), z.null()])
      .optional(),
    isKospi100: z.boolean().optional(),
    isKospi50: z.boolean().optional(),
    isKrx300: z.boolean().optional(),
    warningLevel: z.union([z.string(), z.null()]).optional(),
  }),
  requestedDate: z.string(),
  quotationMarket: z.enum(["KRX", "NXT", "CONSOLIDATED"]),
  isTradingDay: z.boolean(),
  candle: z.union([
    z.object({
      date: z.string().regex(new RegExp("^\\d{4}-\\d{2}-\\d{2}$")),
      openPrice: z.number().min(0),
      highPrice: z.number().min(0),
      lowPrice: z.number().min(0),
      closePrice: z.number().min(0),
      accumulatedVolume: z.number().int().min(0).max(9007199254740991),
    }),
    z.null(),
  ]),
})
export type PriceDailyCandleDto = z.infer<typeof PriceDailyCandleDtoSchema>

export const ReturnSummaryDtoSchema = z.object({
  stock: z.object({
    code: z.string().regex(new RegExp("^[A-Z0-9]{1,9}$")),
    name: z.string(),
    marketName: z.string(),
    quotationMarket: z.enum(["KRX", "NXT", "CONSOLIDATED"]),
    standardCode: z.string().optional(),
    securityGroupCode: z.string().optional(),
    rawEtpType: z.union([z.string(), z.null()]).optional(),
    preferredStockType: z.union([z.string(), z.null()]).optional(),
    productType: z
      .enum([
        "STOCK",
        "PREFERRED",
        "ETF",
        "ETN",
        "REIT",
        "BENEFICIARY_CERTIFICATE",
        "SPAC",
        "OTHER",
      ])
      .optional(),
    isPreferred: z.boolean().optional(),
    isEtf: z.boolean().optional(),
    isEtn: z.boolean().optional(),
    isSpac: z.boolean().optional(),
    isReit: z.boolean().optional(),
    isTradingHalted: z.boolean().optional(),
    isUnderAdministration: z.boolean().optional(),
    isLowLiquidity: z.boolean().optional(),
    marketCap: z
      .union([z.number().int().min(0).max(9007199254740991), z.null()])
      .optional(),
    previousVolume: z
      .union([z.number().int().min(0).max(9007199254740991), z.null()])
      .optional(),
    listedDate: z
      .union([z.string().regex(new RegExp("^\\d{8}$")), z.null()])
      .optional(),
    isKospi100: z.boolean().optional(),
    isKospi50: z.boolean().optional(),
    isKrx300: z.boolean().optional(),
    warningLevel: z.union([z.string(), z.null()]).optional(),
  }),
  buy: z.object({
    date: z.string(),
    price: z.number(),
    priceType: z.literal("adjusted-close"),
    quantity: z.number(),
  }),
  current: z.object({
    price: z.number(),
    source: z.enum(["stock-quote", "daily-candle"]),
    quotationMarket: z.literal("CONSOLIDATED"),
    basis: z.union([
      z.object({
        type: z.literal("current-snapshot"),
        requestedAt: z.string(),
      }),
      z.object({
        type: z.literal("latest-close"),
        tradingDate: z.string(),
      }),
    ]),
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

export const StocksControllerSuggestionResponseSchema =
  ApiSuccessDtoSchema.omit({ data: true }).extend({
    data: SuggestionDtoSchema,
  })
export type StocksControllerSuggestionResponse = z.infer<
  typeof StocksControllerSuggestionResponseSchema
>

export const StocksControllerSearchResponseSchema = ApiSuccessDtoSchema.omit({
  data: true,
}).extend({
  data: z.array(StockDtoSchema),
})
export type StocksControllerSearchResponse = z.infer<
  typeof StocksControllerSearchResponseSchema
>

export const StocksControllerGetResponseSchema = ApiSuccessDtoSchema.omit({
  data: true,
}).extend({
  data: StockDtoSchema,
})
export type StocksControllerGetResponse = z.infer<
  typeof StocksControllerGetResponseSchema
>

export const PricesControllerCurrentResponseSchema = ApiSuccessDtoSchema.omit({
  data: true,
}).extend({
  data: PriceCurrentDtoSchema,
})
export type PricesControllerCurrentResponse = z.infer<
  typeof PricesControllerCurrentResponseSchema
>

export const PricesControllerQuoteResponseSchema = ApiSuccessDtoSchema.omit({
  data: true,
}).extend({
  data: PriceQuoteDtoSchema,
})
export type PricesControllerQuoteResponse = z.infer<
  typeof PricesControllerQuoteResponseSchema
>

export const PricesControllerDailyCandleResponseSchema =
  ApiSuccessDtoSchema.omit({ data: true }).extend({
    data: PriceDailyCandleDtoSchema,
  })
export type PricesControllerDailyCandleResponse = z.infer<
  typeof PricesControllerDailyCandleResponseSchema
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
