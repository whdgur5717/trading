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

export const ReturnChartDtoSchema = z.object({
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
  chart: z.object({
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
  }),
})
export type ReturnChartDto = z.infer<typeof ReturnChartDtoSchema>

export const SubscribedEventDtoSchema = z.object({
  symbol: z.string(),
})
export type SubscribedEventDto = z.infer<typeof SubscribedEventDtoSchema>

export const PriceEventDtoSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  executedAt: z
    .string()
    .regex(
      new RegExp(
        "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$"
      )
    ),
})
export type PriceEventDto = z.infer<typeof PriceEventDtoSchema>

export const MarketEventDtoSchema = z.object({
  session: z.enum(["PRE_MARKET", "REGULAR_MARKET", "AFTER_MARKET", "CLOSED"]),
})
export type MarketEventDto = z.infer<typeof MarketEventDtoSchema>

export const HeartbeatEventDtoSchema = z.object({
  at: z
    .string()
    .regex(
      new RegExp(
        "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$"
      )
    ),
})
export type HeartbeatEventDto = z.infer<typeof HeartbeatEventDtoSchema>

export const DisconnectedEventDtoSchema = z.object({
  closeCode: z.number().int().min(-9007199254740991).max(9007199254740991),
  reason: z.string(),
})
export type DisconnectedEventDto = z.infer<typeof DisconnectedEventDtoSchema>

export const ReconnectedEventDtoSchema = z.object({
  symbols: z.array(z.string()),
})
export type ReconnectedEventDto = z.infer<typeof ReconnectedEventDtoSchema>

export const RealtimeErrorEventDtoSchema = z.object({
  code: z.enum([
    "FEED_UNAVAILABLE",
    "MARKET_SESSION_UNAVAILABLE",
    "MARKET_SESSION_AUTH_UNAVAILABLE",
    "MARKET_SESSION_TIMEOUT",
    "MARKET_SESSION_INVALID_RESPONSE",
    "MARKET_SESSION_NOT_FOUND",
  ]),
  message: z.string(),
  retryAfterMs: z.number().int().min(0).max(9007199254740991),
})
export type RealtimeErrorEventDto = z.infer<typeof RealtimeErrorEventDtoSchema>

export const HealthCheckDtoSchema = z.object({
  status: z.literal("ok"),
})
export type HealthCheckDto = z.infer<typeof HealthCheckDtoSchema>

export const StocksControllerSuggestionResponse200Schema = z.object({
  success: z.literal(true),
  data: SuggestionDtoSchema,
  meta: z.record(z.string(), z.unknown()).optional(),
})
export type StocksControllerSuggestionResponse200 = z.infer<
  typeof StocksControllerSuggestionResponse200Schema
>

export const StocksControllerSearchResponse200Schema = z.object({
  success: z.literal(true),
  data: z.array(StockDtoSchema),
  meta: z.record(z.string(), z.unknown()).optional(),
})
export type StocksControllerSearchResponse200 = z.infer<
  typeof StocksControllerSearchResponse200Schema
>

export const StocksControllerGetResponse200Schema = z.object({
  success: z.literal(true),
  data: StockDtoSchema,
  meta: z.record(z.string(), z.unknown()).optional(),
})
export type StocksControllerGetResponse200 = z.infer<
  typeof StocksControllerGetResponse200Schema
>

export const StocksControllerGetResponse404Schema = z.object({
  success: z.literal(false),
  error: z.object({
    status: z.literal(404),
    type: z.literal("stock.unsupported"),
    message: z.string(),
    data: z.object({
      symbol: z.string(),
    }),
  }),
})
export type StocksControllerGetResponse404 = z.infer<
  typeof StocksControllerGetResponse404Schema
>

export const PricesControllerPriceResponse200Schema = z.object({
  success: z.literal(true),
  data: PriceDtoSchema,
  meta: z.record(z.string(), z.unknown()).optional(),
})
export type PricesControllerPriceResponse200 = z.infer<
  typeof PricesControllerPriceResponse200Schema
>

export const PricesControllerPriceResponse404Schema = z.union([
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(404),
      type: z.literal("stock.unsupported"),
      message: z.string(),
      data: z.object({
        symbol: z.string(),
      }),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(404),
      type: z.literal("market.data_not_found"),
      message: z.string(),
      data: z.object({
        provider: z.enum(["kis", "fsc", "opendart"]),
        endpoint: z.string(),
        upstreamStatus: z.union([
          z.number().int().min(-9007199254740991).max(9007199254740991),
          z.null(),
        ]),
        upstreamCode: z.union([z.string(), z.null()]),
      }),
    }),
  }),
])
export type PricesControllerPriceResponse404 = z.infer<
  typeof PricesControllerPriceResponse404Schema
>

export const PricesControllerPriceResponse502Schema = z.union([
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(502),
      type: z.literal("market.provider_unavailable"),
      message: z.string(),
      data: z.object({
        provider: z.enum(["kis", "fsc", "opendart"]),
        endpoint: z.string(),
        upstreamStatus: z.union([
          z.number().int().min(-9007199254740991).max(9007199254740991),
          z.null(),
        ]),
        upstreamCode: z.union([z.string(), z.null()]),
      }),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(502),
      type: z.literal("market.provider_auth_unavailable"),
      message: z.string(),
      data: z.object({
        provider: z.enum(["kis", "fsc", "opendart"]),
        endpoint: z.string(),
        upstreamStatus: z.union([
          z.number().int().min(-9007199254740991).max(9007199254740991),
          z.null(),
        ]),
        upstreamCode: z.union([z.string(), z.null()]),
      }),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(502),
      type: z.literal("market.provider_invalid_response"),
      message: z.string(),
      data: z.object({
        provider: z.enum(["kis", "fsc", "opendart"]),
        endpoint: z.string(),
        upstreamStatus: z.union([
          z.number().int().min(-9007199254740991).max(9007199254740991),
          z.null(),
        ]),
        upstreamCode: z.union([z.string(), z.null()]),
      }),
    }),
  }),
])
export type PricesControllerPriceResponse502 = z.infer<
  typeof PricesControllerPriceResponse502Schema
>

export const PricesControllerPriceResponse504Schema = z.object({
  success: z.literal(false),
  error: z.object({
    status: z.literal(504),
    type: z.literal("market.provider_timeout"),
    message: z.string(),
    data: z.object({
      provider: z.enum(["kis", "fsc", "opendart"]),
      endpoint: z.string(),
      upstreamStatus: z.union([
        z.number().int().min(-9007199254740991).max(9007199254740991),
        z.null(),
      ]),
      upstreamCode: z.union([z.string(), z.null()]),
    }),
  }),
})
export type PricesControllerPriceResponse504 = z.infer<
  typeof PricesControllerPriceResponse504Schema
>

export const CandlesControllerCandlesResponse200Schema = z.object({
  success: z.literal(true),
  data: CandlesDtoSchema,
  meta: z.record(z.string(), z.unknown()).optional(),
})
export type CandlesControllerCandlesResponse200 = z.infer<
  typeof CandlesControllerCandlesResponse200Schema
>

export const CandlesControllerCandlesResponse404Schema = z.union([
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(404),
      type: z.literal("stock.unsupported"),
      message: z.string(),
      data: z.object({
        symbol: z.string(),
      }),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(404),
      type: z.literal("market.data_not_found"),
      message: z.string(),
      data: z.object({
        provider: z.enum(["kis", "fsc", "opendart"]),
        endpoint: z.string(),
        upstreamStatus: z.union([
          z.number().int().min(-9007199254740991).max(9007199254740991),
          z.null(),
        ]),
        upstreamCode: z.union([z.string(), z.null()]),
      }),
    }),
  }),
])
export type CandlesControllerCandlesResponse404 = z.infer<
  typeof CandlesControllerCandlesResponse404Schema
>

export const CandlesControllerCandlesResponse502Schema = z.union([
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(502),
      type: z.literal("market.provider_unavailable"),
      message: z.string(),
      data: z.object({
        provider: z.enum(["kis", "fsc", "opendart"]),
        endpoint: z.string(),
        upstreamStatus: z.union([
          z.number().int().min(-9007199254740991).max(9007199254740991),
          z.null(),
        ]),
        upstreamCode: z.union([z.string(), z.null()]),
      }),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(502),
      type: z.literal("market.provider_auth_unavailable"),
      message: z.string(),
      data: z.object({
        provider: z.enum(["kis", "fsc", "opendart"]),
        endpoint: z.string(),
        upstreamStatus: z.union([
          z.number().int().min(-9007199254740991).max(9007199254740991),
          z.null(),
        ]),
        upstreamCode: z.union([z.string(), z.null()]),
      }),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(502),
      type: z.literal("market.provider_invalid_response"),
      message: z.string(),
      data: z.object({
        provider: z.enum(["kis", "fsc", "opendart"]),
        endpoint: z.string(),
        upstreamStatus: z.union([
          z.number().int().min(-9007199254740991).max(9007199254740991),
          z.null(),
        ]),
        upstreamCode: z.union([z.string(), z.null()]),
      }),
    }),
  }),
])
export type CandlesControllerCandlesResponse502 = z.infer<
  typeof CandlesControllerCandlesResponse502Schema
>

export const CandlesControllerCandlesResponse504Schema = z.object({
  success: z.literal(false),
  error: z.object({
    status: z.literal(504),
    type: z.literal("market.provider_timeout"),
    message: z.string(),
    data: z.object({
      provider: z.enum(["kis", "fsc", "opendart"]),
      endpoint: z.string(),
      upstreamStatus: z.union([
        z.number().int().min(-9007199254740991).max(9007199254740991),
        z.null(),
      ]),
      upstreamCode: z.union([z.string(), z.null()]),
    }),
  }),
})
export type CandlesControllerCandlesResponse504 = z.infer<
  typeof CandlesControllerCandlesResponse504Schema
>

export const ReturnsControllerCalculateResponse200Schema = z.object({
  success: z.literal(true),
  data: ReturnSummaryDtoSchema,
  meta: z.record(z.string(), z.unknown()).optional(),
})
export type ReturnsControllerCalculateResponse200 = z.infer<
  typeof ReturnsControllerCalculateResponse200Schema
>

export const ReturnsControllerCalculateResponse404Schema = z.union([
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(404),
      type: z.literal("stock.unsupported"),
      message: z.string(),
      data: z.object({
        symbol: z.string(),
      }),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(404),
      type: z.literal("market.data_not_found"),
      message: z.string(),
      data: z.object({
        provider: z.enum(["kis", "fsc", "opendart"]),
        endpoint: z.string(),
        upstreamStatus: z.union([
          z.number().int().min(-9007199254740991).max(9007199254740991),
          z.null(),
        ]),
        upstreamCode: z.union([z.string(), z.null()]),
      }),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(404),
      type: z.literal("returns.buy_price_not_found"),
      message: z.string(),
      data: z.object({
        symbol: z.string(),
        buyDate: z.string(),
      }),
    }),
  }),
])
export type ReturnsControllerCalculateResponse404 = z.infer<
  typeof ReturnsControllerCalculateResponse404Schema
>

export const ReturnsControllerCalculateResponse502Schema = z.union([
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(502),
      type: z.literal("market.provider_unavailable"),
      message: z.string(),
      data: z.object({
        provider: z.enum(["kis", "fsc", "opendart"]),
        endpoint: z.string(),
        upstreamStatus: z.union([
          z.number().int().min(-9007199254740991).max(9007199254740991),
          z.null(),
        ]),
        upstreamCode: z.union([z.string(), z.null()]),
      }),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(502),
      type: z.literal("market.provider_auth_unavailable"),
      message: z.string(),
      data: z.object({
        provider: z.enum(["kis", "fsc", "opendart"]),
        endpoint: z.string(),
        upstreamStatus: z.union([
          z.number().int().min(-9007199254740991).max(9007199254740991),
          z.null(),
        ]),
        upstreamCode: z.union([z.string(), z.null()]),
      }),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(502),
      type: z.literal("market.provider_invalid_response"),
      message: z.string(),
      data: z.object({
        provider: z.enum(["kis", "fsc", "opendart"]),
        endpoint: z.string(),
        upstreamStatus: z.union([
          z.number().int().min(-9007199254740991).max(9007199254740991),
          z.null(),
        ]),
        upstreamCode: z.union([z.string(), z.null()]),
      }),
    }),
  }),
])
export type ReturnsControllerCalculateResponse502 = z.infer<
  typeof ReturnsControllerCalculateResponse502Schema
>

export const ReturnsControllerCalculateResponse504Schema = z.object({
  success: z.literal(false),
  error: z.object({
    status: z.literal(504),
    type: z.literal("market.provider_timeout"),
    message: z.string(),
    data: z.object({
      provider: z.enum(["kis", "fsc", "opendart"]),
      endpoint: z.string(),
      upstreamStatus: z.union([
        z.number().int().min(-9007199254740991).max(9007199254740991),
        z.null(),
      ]),
      upstreamCode: z.union([z.string(), z.null()]),
    }),
  }),
})
export type ReturnsControllerCalculateResponse504 = z.infer<
  typeof ReturnsControllerCalculateResponse504Schema
>

export const ReturnsControllerChartResponse200Schema = z.object({
  success: z.literal(true),
  data: ReturnChartDtoSchema,
  meta: z.record(z.string(), z.unknown()).optional(),
})
export type ReturnsControllerChartResponse200 = z.infer<
  typeof ReturnsControllerChartResponse200Schema
>

export const ReturnsControllerChartResponse404Schema = z.union([
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(404),
      type: z.literal("stock.unsupported"),
      message: z.string(),
      data: z.object({
        symbol: z.string(),
      }),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(404),
      type: z.literal("market.data_not_found"),
      message: z.string(),
      data: z.object({
        provider: z.enum(["kis", "fsc", "opendart"]),
        endpoint: z.string(),
        upstreamStatus: z.union([
          z.number().int().min(-9007199254740991).max(9007199254740991),
          z.null(),
        ]),
        upstreamCode: z.union([z.string(), z.null()]),
      }),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(404),
      type: z.literal("returns.buy_price_not_found"),
      message: z.string(),
      data: z.object({
        symbol: z.string(),
        buyDate: z.string(),
      }),
    }),
  }),
])
export type ReturnsControllerChartResponse404 = z.infer<
  typeof ReturnsControllerChartResponse404Schema
>

export const ReturnsControllerChartResponse502Schema = z.union([
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(502),
      type: z.literal("market.provider_unavailable"),
      message: z.string(),
      data: z.object({
        provider: z.enum(["kis", "fsc", "opendart"]),
        endpoint: z.string(),
        upstreamStatus: z.union([
          z.number().int().min(-9007199254740991).max(9007199254740991),
          z.null(),
        ]),
        upstreamCode: z.union([z.string(), z.null()]),
      }),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(502),
      type: z.literal("market.provider_auth_unavailable"),
      message: z.string(),
      data: z.object({
        provider: z.enum(["kis", "fsc", "opendart"]),
        endpoint: z.string(),
        upstreamStatus: z.union([
          z.number().int().min(-9007199254740991).max(9007199254740991),
          z.null(),
        ]),
        upstreamCode: z.union([z.string(), z.null()]),
      }),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(502),
      type: z.literal("market.provider_invalid_response"),
      message: z.string(),
      data: z.object({
        provider: z.enum(["kis", "fsc", "opendart"]),
        endpoint: z.string(),
        upstreamStatus: z.union([
          z.number().int().min(-9007199254740991).max(9007199254740991),
          z.null(),
        ]),
        upstreamCode: z.union([z.string(), z.null()]),
      }),
    }),
  }),
])
export type ReturnsControllerChartResponse502 = z.infer<
  typeof ReturnsControllerChartResponse502Schema
>

export const ReturnsControllerChartResponse504Schema = z.object({
  success: z.literal(false),
  error: z.object({
    status: z.literal(504),
    type: z.literal("market.provider_timeout"),
    message: z.string(),
    data: z.object({
      provider: z.enum(["kis", "fsc", "opendart"]),
      endpoint: z.string(),
      upstreamStatus: z.union([
        z.number().int().min(-9007199254740991).max(9007199254740991),
        z.null(),
      ]),
      upstreamCode: z.union([z.string(), z.null()]),
    }),
  }),
})
export type ReturnsControllerChartResponse504 = z.infer<
  typeof ReturnsControllerChartResponse504Schema
>

export const StreamRealtimePricesEventSchema = z.union([
  z.object({
    event: z.literal("subscribed"),
    id: z.string().optional(),
    data: SubscribedEventDtoSchema,
  }),
  z.object({
    event: z.literal("price"),
    id: z.string().optional(),
    data: PriceEventDtoSchema,
  }),
  z.object({
    event: z.literal("market"),
    id: z.string().optional(),
    data: MarketEventDtoSchema,
  }),
  z.object({
    event: z.literal("heartbeat"),
    id: z.string().optional(),
    data: HeartbeatEventDtoSchema,
  }),
  z.object({
    event: z.literal("disconnected"),
    id: z.string().optional(),
    data: DisconnectedEventDtoSchema,
  }),
  z.object({
    event: z.literal("reconnected"),
    id: z.string().optional(),
    data: ReconnectedEventDtoSchema,
  }),
  z.object({
    event: z.literal("realtime-error"),
    id: z.string().optional(),
    retry: z.number().optional(),
    data: RealtimeErrorEventDtoSchema,
  }),
])
export type StreamRealtimePricesEvent = z.infer<
  typeof StreamRealtimePricesEventSchema
>

export const StreamRealtimePricesResponse400Schema = z.object({
  success: z.literal(false),
  error: z.object({
    type: z.literal("common.invalid_request"),
    status: z.literal(400),
    message: z.string(),
    data: z.object({
      issues: z.array(z.unknown()),
    }),
  }),
})
export type StreamRealtimePricesResponse400 = z.infer<
  typeof StreamRealtimePricesResponse400Schema
>

export const StreamRealtimePricesResponse404Schema = z.object({
  success: z.literal(false),
  error: z.object({
    type: z.literal("stock.unsupported"),
    status: z.literal(404),
    message: z.string(),
    data: z.object({
      symbol: z.string(),
    }),
  }),
})
export type StreamRealtimePricesResponse404 = z.infer<
  typeof StreamRealtimePricesResponse404Schema
>

export const HealthControllerCheckResponse200Schema = HealthCheckDtoSchema
export type HealthControllerCheckResponse200 = z.infer<
  typeof HealthControllerCheckResponse200Schema
>

export const ApiErrorDtoSchema = z.union([
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(404),
      type: z.literal("stock.unsupported"),
      message: z.string(),
      data: z.object({
        symbol: z.string(),
      }),
    }),
  }),
  z.union([
    z.object({
      success: z.literal(false),
      error: z.object({
        status: z.literal(404),
        type: z.literal("stock.unsupported"),
        message: z.string(),
        data: z.object({
          symbol: z.string(),
        }),
      }),
    }),
    z.object({
      success: z.literal(false),
      error: z.object({
        status: z.literal(404),
        type: z.literal("market.data_not_found"),
        message: z.string(),
        data: z.object({
          provider: z.enum(["kis", "fsc", "opendart"]),
          endpoint: z.string(),
          upstreamStatus: z.union([
            z.number().int().min(-9007199254740991).max(9007199254740991),
            z.null(),
          ]),
          upstreamCode: z.union([z.string(), z.null()]),
        }),
      }),
    }),
  ]),
  z.union([
    z.object({
      success: z.literal(false),
      error: z.object({
        status: z.literal(502),
        type: z.literal("market.provider_unavailable"),
        message: z.string(),
        data: z.object({
          provider: z.enum(["kis", "fsc", "opendart"]),
          endpoint: z.string(),
          upstreamStatus: z.union([
            z.number().int().min(-9007199254740991).max(9007199254740991),
            z.null(),
          ]),
          upstreamCode: z.union([z.string(), z.null()]),
        }),
      }),
    }),
    z.object({
      success: z.literal(false),
      error: z.object({
        status: z.literal(502),
        type: z.literal("market.provider_auth_unavailable"),
        message: z.string(),
        data: z.object({
          provider: z.enum(["kis", "fsc", "opendart"]),
          endpoint: z.string(),
          upstreamStatus: z.union([
            z.number().int().min(-9007199254740991).max(9007199254740991),
            z.null(),
          ]),
          upstreamCode: z.union([z.string(), z.null()]),
        }),
      }),
    }),
    z.object({
      success: z.literal(false),
      error: z.object({
        status: z.literal(502),
        type: z.literal("market.provider_invalid_response"),
        message: z.string(),
        data: z.object({
          provider: z.enum(["kis", "fsc", "opendart"]),
          endpoint: z.string(),
          upstreamStatus: z.union([
            z.number().int().min(-9007199254740991).max(9007199254740991),
            z.null(),
          ]),
          upstreamCode: z.union([z.string(), z.null()]),
        }),
      }),
    }),
  ]),
  z.object({
    success: z.literal(false),
    error: z.object({
      status: z.literal(504),
      type: z.literal("market.provider_timeout"),
      message: z.string(),
      data: z.object({
        provider: z.enum(["kis", "fsc", "opendart"]),
        endpoint: z.string(),
        upstreamStatus: z.union([
          z.number().int().min(-9007199254740991).max(9007199254740991),
          z.null(),
        ]),
        upstreamCode: z.union([z.string(), z.null()]),
      }),
    }),
  }),
  z.union([
    z.object({
      success: z.literal(false),
      error: z.object({
        status: z.literal(404),
        type: z.literal("stock.unsupported"),
        message: z.string(),
        data: z.object({
          symbol: z.string(),
        }),
      }),
    }),
    z.object({
      success: z.literal(false),
      error: z.object({
        status: z.literal(404),
        type: z.literal("market.data_not_found"),
        message: z.string(),
        data: z.object({
          provider: z.enum(["kis", "fsc", "opendart"]),
          endpoint: z.string(),
          upstreamStatus: z.union([
            z.number().int().min(-9007199254740991).max(9007199254740991),
            z.null(),
          ]),
          upstreamCode: z.union([z.string(), z.null()]),
        }),
      }),
    }),
    z.object({
      success: z.literal(false),
      error: z.object({
        status: z.literal(404),
        type: z.literal("returns.buy_price_not_found"),
        message: z.string(),
        data: z.object({
          symbol: z.string(),
          buyDate: z.string(),
        }),
      }),
    }),
  ]),
  z.object({
    success: z.literal(false),
    error: z.object({
      type: z.literal("common.invalid_request"),
      status: z.literal(400),
      message: z.string(),
      data: z.object({
        issues: z.array(z.unknown()),
      }),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      type: z.literal("stock.unsupported"),
      status: z.literal(404),
      message: z.string(),
      data: z.object({
        symbol: z.string(),
      }),
    }),
  }),
])
export type ApiErrorDto = z.infer<typeof ApiErrorDtoSchema>
