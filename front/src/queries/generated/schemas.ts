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

export const StocksControllerSearchResponse200Schema = z.object({
  success: z.literal(true),
  data: z.array(StockDtoSchema),
})
export type StocksControllerSearchResponse200 = z.infer<
  typeof StocksControllerSearchResponse200Schema
>

export const StocksControllerGetResponse200Schema = z.object({
  success: z.literal(true),
  data: StockDtoSchema,
})
export type StocksControllerGetResponse200 = z.infer<
  typeof StocksControllerGetResponse200Schema
>

export const StocksControllerGetResponse404Schema = z.object({
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

export const PricesControllerPriceResponse404Schema = z.union([
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
  z.object({
    success: z.literal(false),
    error: z.object({
      type: z.literal("market.data_not_found"),
      status: z.literal(404),
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
      type: z.literal("market.provider_unavailable"),
      status: z.literal(502),
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
      type: z.literal("market.provider_auth_unavailable"),
      status: z.literal(502),
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
      type: z.literal("market.provider_invalid_response"),
      status: z.literal(502),
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
    type: z.literal("market.provider_timeout"),
    status: z.literal(504),
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
})
export type CandlesControllerCandlesResponse200 = z.infer<
  typeof CandlesControllerCandlesResponse200Schema
>

export const CandlesControllerCandlesResponse404Schema = z.union([
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
  z.object({
    success: z.literal(false),
    error: z.object({
      type: z.literal("market.data_not_found"),
      status: z.literal(404),
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
      type: z.literal("market.provider_unavailable"),
      status: z.literal(502),
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
      type: z.literal("market.provider_auth_unavailable"),
      status: z.literal(502),
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
      type: z.literal("market.provider_invalid_response"),
      status: z.literal(502),
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
    type: z.literal("market.provider_timeout"),
    status: z.literal(504),
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
})
export type ReturnsControllerCalculateResponse200 = z.infer<
  typeof ReturnsControllerCalculateResponse200Schema
>

export const ReturnsControllerCalculateResponse404Schema = z.union([
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
  z.object({
    success: z.literal(false),
    error: z.object({
      type: z.literal("market.data_not_found"),
      status: z.literal(404),
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
      type: z.literal("returns.buy_price_not_found"),
      status: z.literal(404),
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
      type: z.literal("market.provider_unavailable"),
      status: z.literal(502),
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
      type: z.literal("market.provider_auth_unavailable"),
      status: z.literal(502),
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
      type: z.literal("market.provider_invalid_response"),
      status: z.literal(502),
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
    type: z.literal("market.provider_timeout"),
    status: z.literal(504),
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
})
export type ReturnsControllerChartResponse200 = z.infer<
  typeof ReturnsControllerChartResponse200Schema
>

export const ReturnsControllerChartResponse404Schema = z.union([
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
  z.object({
    success: z.literal(false),
    error: z.object({
      type: z.literal("market.data_not_found"),
      status: z.literal(404),
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
      type: z.literal("returns.buy_price_not_found"),
      status: z.literal(404),
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
      type: z.literal("market.provider_unavailable"),
      status: z.literal(502),
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
      type: z.literal("market.provider_auth_unavailable"),
      status: z.literal(502),
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
      type: z.literal("market.provider_invalid_response"),
      status: z.literal(502),
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
    type: z.literal("market.provider_timeout"),
    status: z.literal(504),
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
        type: z.literal("common.invalid_request"),
        status: z.literal(400),
        message: z.string(),
        data: z.object({
          issues: z.array(z.unknown()),
        }),
      }),
      z.object({
        type: z.literal("stock.unsupported"),
        status: z.literal(404),
        message: z.string(),
        data: z.object({
          symbol: z.string(),
        }),
      }),
      RealtimeErrorDtoSchema,
      z.string(),
    ]),
  }),
])
export type RealtimeControllerStreamEvent = z.infer<
  typeof RealtimeControllerStreamEventSchema
>

export const HealthControllerCheckResponse200Schema = HealthCheckDtoSchema
export type HealthControllerCheckResponse200 = z.infer<
  typeof HealthControllerCheckResponse200Schema
>

export const ApiErrorDtoSchema = z.union([
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
  z.union([
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
    z.object({
      success: z.literal(false),
      error: z.object({
        type: z.literal("market.data_not_found"),
        status: z.literal(404),
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
        type: z.literal("market.provider_unavailable"),
        status: z.literal(502),
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
        type: z.literal("market.provider_auth_unavailable"),
        status: z.literal(502),
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
        type: z.literal("market.provider_invalid_response"),
        status: z.literal(502),
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
      type: z.literal("market.provider_timeout"),
      status: z.literal(504),
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
        type: z.literal("stock.unsupported"),
        status: z.literal(404),
        message: z.string(),
        data: z.object({
          symbol: z.string(),
        }),
      }),
    }),
    z.object({
      success: z.literal(false),
      error: z.object({
        type: z.literal("market.data_not_found"),
        status: z.literal(404),
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
        type: z.literal("returns.buy_price_not_found"),
        status: z.literal(404),
        message: z.string(),
        data: z.object({
          symbol: z.string(),
          buyDate: z.string(),
        }),
      }),
    }),
  ]),
])
export type ApiErrorDto = z.infer<typeof ApiErrorDtoSchema>
