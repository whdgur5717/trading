import { z } from "zod"

export const SuggestionDtoSchema = z.object({
  items: z.array(
    z.object({
      symbol: z.string().regex(new RegExp("^[A-Z0-9]{1,9}$")),
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
  symbol: z.string().regex(new RegExp("^[A-Z0-9]{1,9}$")),
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

export const PriceDtoSchema = z.object({
  symbol: z.string().regex(new RegExp("^[A-Z0-9]{1,9}$")),
  currentPrice: z.string().min(1),
  openPrice: z.string().min(1),
  highPrice: z.string().min(1),
  lowPrice: z.string().min(1),
  volume: z.string().min(1),
  changePrice: z.string().min(1),
  changeRate: z.string().min(1),
})
export type PriceDto = z.infer<typeof PriceDtoSchema>

export const CandlesDtoSchema = z.object({
  symbol: z.string().regex(new RegExp("^[A-Z0-9]{1,9}$")),
  interval: z.literal("1d"),
  candles: z.array(
    z.object({
      timestamp: z.string(),
      openPrice: z.string().min(1),
      highPrice: z.string().min(1),
      lowPrice: z.string().min(1),
      closePrice: z.string().min(1),
      volume: z.string().min(1),
    })
  ),
  nextBefore: z.union([z.string(), z.null()]),
})
export type CandlesDto = z.infer<typeof CandlesDtoSchema>

export const ReturnSummaryDtoSchema = z.object({
  stock: z.object({
    symbol: z.string().regex(new RegExp("^[A-Z0-9]{1,9}$")),
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
    price: z.string(),
    quantity: z.number(),
  }),
  current: z.object({
    currentPrice: z.string().min(1),
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
  symbol: z.string(),
  trId: z.string(),
  price: z.number(),
  tradeTime: z.string(),
  businessDate: z.string(),
})
export type RealtimePriceDto = z.infer<typeof RealtimePriceDtoSchema>

export const RealtimeReconnectedDtoSchema = z.object({
  symbols: z.array(z.string()),
})
export type RealtimeReconnectedDto = z.infer<
  typeof RealtimeReconnectedDtoSchema
>

export const RealtimeSubscribedDtoSchema = z.object({
  symbol: z.string(),
})
export type RealtimeSubscribedDto = z.infer<typeof RealtimeSubscribedDtoSchema>

export const JobjuScoreDtoSchema = z.object({
  stock: z.object({
    symbol: z.string().regex(new RegExp("^[A-Z0-9]{1,9}$")),
    name: z.string(),
    marketName: z.string(),
  }),
  asOfDate: z.string().regex(new RegExp("^\\d{4}-\\d{2}-\\d{2}$")),
  sampleDays: z.number().int().max(9007199254740991).gt(0),
  score: z.number().int().min(0).max(100),
  grade: z.enum(["normal", "notice", "suspect", "high", "danger"]),
  label: z.string(),
  summary: z.string(),
  signals: z.array(
    z.object({
      type: z.enum([
        "price-volatility",
        "liquidity",
        "market-size",
        "market-sensitivity",
        "status-flags",
        "financial-disclosure",
      ]),
      label: z.string(),
      score: z.number().int().min(0).max(9007199254740991),
      maxScore: z.number().int().max(9007199254740991).gt(0),
      description: z.string(),
    })
  ),
})
export type JobjuScoreDto = z.infer<typeof JobjuScoreDtoSchema>

export const HealthCheckDtoSchema = z.object({
  status: z.literal("ok"),
})
export type HealthCheckDto = z.infer<typeof HealthCheckDtoSchema>

export const StocksControllerSuggestionResponse200Schema = z.object({
  success: z.literal(true),
  data: SuggestionDtoSchema,
})
export type StocksControllerSuggestionResponse200 = z.infer<
  typeof StocksControllerSuggestionResponse200Schema
>

export const StocksControllerSuggestionResponse400Schema = z.object({
  success: z.literal(false),
  error: z.object({
    status: z.literal(400),
    code: z.literal("invalid-request"),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})
export type StocksControllerSuggestionResponse400 = z.infer<
  typeof StocksControllerSuggestionResponse400Schema
>

export const StocksControllerSearchResponse200Schema = z.object({
  success: z.literal(true),
  data: z.array(StockDtoSchema),
})
export type StocksControllerSearchResponse200 = z.infer<
  typeof StocksControllerSearchResponse200Schema
>

export const StocksControllerSearchResponse400Schema = z.object({
  success: z.literal(false),
  error: z.object({
    status: z.literal(400),
    code: z.literal("invalid-request"),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})
export type StocksControllerSearchResponse400 = z.infer<
  typeof StocksControllerSearchResponse400Schema
>

export const StocksControllerGetResponse200Schema = z.object({
  success: z.literal(true),
  data: StockDtoSchema,
})
export type StocksControllerGetResponse200 = z.infer<
  typeof StocksControllerGetResponse200Schema
>

export const StocksControllerGetResponse400Schema = z.object({
  success: z.literal(false),
  error: z.object({
    status: z.literal(400),
    code: z.literal("invalid-request"),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})
export type StocksControllerGetResponse400 = z.infer<
  typeof StocksControllerGetResponse400Schema
>

export const StocksControllerGetResponse404Schema = z.object({
  success: z.literal(false),
  error: z.object({
    status: z.literal(404),
    code: z.literal("unsupported-stock"),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})
export type StocksControllerGetResponse404 = z.infer<
  typeof StocksControllerGetResponse404Schema
>

export const PricesControllerPriceResponse200Schema = z.object({
  success: z.literal(true),
  data: PriceDtoSchema,
})
export type PricesControllerPriceResponse200 = z.infer<
  typeof PricesControllerPriceResponse200Schema
>

export const PricesControllerPriceResponse400Schema = z.object({
  success: z.literal(false),
  error: z.object({
    status: z.literal(400),
    code: z.literal("invalid-request"),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})
export type PricesControllerPriceResponse400 = z.infer<
  typeof PricesControllerPriceResponse400Schema
>

export const PricesControllerPriceResponse404Schema = z.union([
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(404),
      code: z.literal("unsupported-stock"),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(404),
      code: z.literal("market-data-not-found"),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  }),
])
export type PricesControllerPriceResponse404 = z.infer<
  typeof PricesControllerPriceResponse404Schema
>

export const CandlesControllerCandlesResponse200Schema = z.object({
  success: z.literal(true),
  data: CandlesDtoSchema,
})
export type CandlesControllerCandlesResponse200 = z.infer<
  typeof CandlesControllerCandlesResponse200Schema
>

export const CandlesControllerCandlesResponse400Schema = z.object({
  success: z.literal(false),
  error: z.object({
    status: z.literal(400),
    code: z.literal("invalid-request"),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})
export type CandlesControllerCandlesResponse400 = z.infer<
  typeof CandlesControllerCandlesResponse400Schema
>

export const CandlesControllerCandlesResponse404Schema = z.union([
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(404),
      code: z.literal("unsupported-stock"),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(404),
      code: z.literal("market-data-not-found"),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  }),
])
export type CandlesControllerCandlesResponse404 = z.infer<
  typeof CandlesControllerCandlesResponse404Schema
>

export const ReturnsControllerCalculateResponse200Schema = z.object({
  success: z.literal(true),
  data: ReturnSummaryDtoSchema,
})
export type ReturnsControllerCalculateResponse200 = z.infer<
  typeof ReturnsControllerCalculateResponse200Schema
>

export const ReturnsControllerCalculateResponse400Schema = z.object({
  success: z.literal(false),
  error: z.object({
    status: z.literal(400),
    code: z.literal("invalid-request"),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})
export type ReturnsControllerCalculateResponse400 = z.infer<
  typeof ReturnsControllerCalculateResponse400Schema
>

export const ReturnsControllerCalculateResponse404Schema = z.union([
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(404),
      code: z.literal("unsupported-stock"),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(404),
      code: z.literal("market-data-not-found"),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  }),
])
export type ReturnsControllerCalculateResponse404 = z.infer<
  typeof ReturnsControllerCalculateResponse404Schema
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
    data: z.union([
      z.object({
        status: z.literal(400),
        code: z.literal("invalid-request"),
        message: z.string(),
        details: z.unknown().optional(),
      }),
      z.object({
        status: z.literal(404),
        code: z.literal("unsupported-stock"),
        message: z.string(),
        details: z.unknown().optional(),
      }),
      RealtimeErrorDtoSchema,
      z.string(),
    ]),
  }),
])
export type RealtimeControllerStreamEvent = z.infer<
  typeof RealtimeControllerStreamEventSchema
>

export const RealtimeControllerStreamResponse400Schema = z.object({
  success: z.literal(false),
  error: z.object({
    status: z.literal(400),
    code: z.literal("invalid-request"),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})
export type RealtimeControllerStreamResponse400 = z.infer<
  typeof RealtimeControllerStreamResponse400Schema
>

export const JobjuControllerScoreResponse200Schema = z.object({
  success: z.literal(true),
  data: JobjuScoreDtoSchema,
})
export type JobjuControllerScoreResponse200 = z.infer<
  typeof JobjuControllerScoreResponse200Schema
>

export const JobjuControllerScoreResponse400Schema = z.object({
  success: z.literal(false),
  error: z.object({
    status: z.literal(400),
    code: z.literal("invalid-request"),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})
export type JobjuControllerScoreResponse400 = z.infer<
  typeof JobjuControllerScoreResponse400Schema
>

export const JobjuControllerScoreResponse404Schema = z.object({
  success: z.literal(false),
  error: z.object({
    status: z.literal(404),
    code: z.literal("unsupported-stock"),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})
export type JobjuControllerScoreResponse404 = z.infer<
  typeof JobjuControllerScoreResponse404Schema
>

export const JobjuControllerScoreResponse422Schema = z.union([
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(422),
      code: z.literal("jobju-unsupported-product"),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(422),
      code: z.literal("jobju-invalid-market"),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  }),
])
export type JobjuControllerScoreResponse422 = z.infer<
  typeof JobjuControllerScoreResponse422Schema
>

export const HealthControllerCheckResponse200Schema = z.object({
  success: z.literal(true),
  data: HealthCheckDtoSchema,
})
export type HealthControllerCheckResponse200 = z.infer<
  typeof HealthControllerCheckResponse200Schema
>

export const HealthControllerCheckResponse400Schema = z.object({
  success: z.literal(false),
  error: z.object({
    status: z.literal(400),
    code: z.literal("invalid-request"),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})
export type HealthControllerCheckResponse400 = z.infer<
  typeof HealthControllerCheckResponse400Schema
>

export const ApiErrorDtoSchema = z.union([
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(400),
      code: z.literal("invalid-request"),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(500),
      code: z.literal("internal-error"),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(404),
      code: z.literal("unsupported-stock"),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  }),
  z.union([
    z.object({
      success: z.literal(false),
      error: z.object({
        status: z.literal(404),
        code: z.literal("unsupported-stock"),
        message: z.string(),
        details: z.unknown().optional(),
      }),
    }),
    z.object({
      success: z.literal(false),
      error: z.object({
        status: z.literal(404),
        code: z.literal("market-data-not-found"),
        message: z.string(),
        details: z.unknown().optional(),
      }),
    }),
  ]),
  z.union([
    z.object({
      success: z.literal(false),
      error: z.object({
        status: z.literal(502),
        code: z.literal("market-data-unavailable"),
        message: z.string(),
        details: z.unknown().optional(),
      }),
    }),
    z.object({
      success: z.literal(false),
      error: z.object({
        status: z.literal(502),
        code: z.literal("market-data-auth-unavailable"),
        message: z.string(),
        details: z.unknown().optional(),
      }),
    }),
    z.object({
      success: z.literal(false),
      error: z.object({
        status: z.literal(502),
        code: z.literal("market-data-invalid-response"),
        message: z.string(),
        details: z.unknown().optional(),
      }),
    }),
  ]),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(504),
      code: z.literal("market-data-timeout"),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  }),
  z.union([
    z.object({
      success: z.literal(false),
      error: z.object({
        status: z.literal(422),
        code: z.literal("jobju-unsupported-product"),
        message: z.string(),
        details: z.unknown().optional(),
      }),
    }),
    z.object({
      success: z.literal(false),
      error: z.object({
        status: z.literal(422),
        code: z.literal("jobju-invalid-market"),
        message: z.string(),
        details: z.unknown().optional(),
      }),
    }),
  ]),
  z.union([
    z.object({
      success: z.literal(false),
      error: z.object({
        status: z.literal(502),
        code: z.literal("jobju-score-unavailable"),
        message: z.string(),
        details: z.unknown().optional(),
      }),
    }),
    z.object({
      success: z.literal(false),
      error: z.object({
        status: z.literal(502),
        code: z.literal("jobju-financial-data-unavailable"),
        message: z.string(),
        details: z.unknown().optional(),
      }),
    }),
  ]),
])
export type ApiErrorDto = z.infer<typeof ApiErrorDtoSchema>
