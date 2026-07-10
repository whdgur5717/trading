import { z } from "zod"
import { defineErrors, type ErrorOf } from "../common/error/define"

export const marketProviderSchema = z
  .enum(["kis", "fsc", "opendart"])
  .meta({ example: "kis" })

const providerDataSchema = z.object({
  provider: marketProviderSchema,
  endpoint: z
    .string()
    .meta({ example: "/uapi/domestic-stock/v1/quotations/inquire-price" }),
  upstreamStatus: z.number().int().nullable().meta({ example: 502 }),
  upstreamCode: z.string().nullable().meta({ example: "EGW00123" }),
})

export const marketErrors = defineErrors({
  providerUnavailable: {
    type: "market.provider_unavailable",
    status: 502,
    message: "Market data provider is unavailable",
    description:
      "The upstream market data provider could not complete the request.",
    data: providerDataSchema,
  },
  providerAuthUnavailable: {
    type: "market.provider_auth_unavailable",
    status: 502,
    message: "Market data authorization is unavailable",
    description:
      "The upstream market data provider rejected or failed authorization.",
    data: providerDataSchema,
  },
  providerTimeout: {
    type: "market.provider_timeout",
    status: 504,
    message: "Market data provider timed out",
    description: "The upstream market data request exceeded its time limit.",
    data: providerDataSchema,
  },
  providerInvalidResponse: {
    type: "market.provider_invalid_response",
    status: 502,
    message: "Market data provider response is invalid",
    description:
      "The upstream market data provider returned a response that does not match the expected contract.",
    data: providerDataSchema,
  },
  dataNotFound: {
    type: "market.data_not_found",
    status: 404,
    message: "Market data was not found",
    description:
      "The requested market data point is required for this operation but was not available from the provider.",
    data: providerDataSchema,
  },
})

export type MarketDataProviderError = ErrorOf<
  Pick<
    typeof marketErrors,
    | "providerUnavailable"
    | "providerAuthUnavailable"
    | "providerTimeout"
    | "providerInvalidResponse"
  >
>

export type MarketDataError = ErrorOf<typeof marketErrors>
