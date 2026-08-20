import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { err, ok, type Result } from "neverthrow"
import type { z } from "zod"
import { FscErrorResponse, rest } from "#generated/fsc/rest/api"
import {
  HttpRequestError,
  HttpRequestProvider,
  type HttpResponse,
} from "../../../../common/http/httpRequest.provider"
import type { DailyMarketIndex, DailyStockPrice } from "../../../schema"
import { externalErrors, type ExternalError } from "../../../error"
import { fscMarketIndexMapper, fscStockPriceMapper } from "./schema"

@Injectable()
export class FscClient {
  constructor(
    private readonly httpRequestProvider: HttpRequestProvider,
    private readonly config: ConfigService
  ) {}

  dailyStocks(date: string): Promise<Result<DailyStockPrice[], ExternalError>> {
    return this.get(
      rest.fscStockPriceInfo,
      { basDt: compactDate(date), numOfRows: "5000", pageNo: "1" },
      fscStockPriceMapper
    )
  }

  dailyIndexes(
    date: string
  ): Promise<Result<DailyMarketIndex[], ExternalError>> {
    return this.get(
      rest.fscMarketIndexInfo,
      { basDt: compactDate(date), numOfRows: "200", pageNo: "1" },
      fscMarketIndexMapper
    )
  }

  private async get<TSchema extends z.ZodType>(
    api: { method: "get"; path: string },
    query: Record<string, string>,
    schema: TSchema
  ): Promise<Result<z.output<TSchema>, ExternalError>> {
    let response: HttpResponse

    try {
      response = await this.httpRequestProvider.request({
        method: api.method,
        url: `${this.restBaseUrl}${api.path}`,
        query: {
          serviceKey: this.serviceKey,
          resultType: "json",
          ...query,
        },
        validateStatus: (status) => status >= 200 && status < 300,
      })
    } catch (error) {
      if (!(error instanceof HttpRequestError)) {
        throw error
      }

      const upstreamStatus = error.response?.status ?? null
      const upstreamCode = error.code ?? null
      return err(
        (error.kind === "timeout"
          ? externalErrors.providerTimeout
          : externalErrors.providerUnavailable)({
          provider: "fsc",
          endpoint: api.path,
          upstreamStatus,
          upstreamCode,
        })
      )
    }

    const header = FscErrorResponse.safeParse(response.data)

    if (header.success && header.data.response.header.resultCode !== "00") {
      return err(
        externalErrors.providerUnavailable({
          provider: "fsc",
          endpoint: api.path,
          upstreamStatus: response.status,
          upstreamCode: header.data.response.header.resultCode,
        })
      )
    }

    const parsed = schema.safeParse(response.data)

    if (!parsed.success) {
      return err(
        externalErrors.providerInvalidResponse({
          provider: "fsc",
          endpoint: api.path,
          upstreamStatus: response.status,
          upstreamCode: null,
        })
      )
    }

    return ok(parsed.data)
  }

  private get serviceKey(): string {
    return this.config.getOrThrow<string>("PUBLIC_DATA_SERVICE_KEY")
  }

  private get restBaseUrl(): string {
    return this.config.getOrThrow<string>("FSC_REST_BASE_URL")
  }
}

function compactDate(date: string): string {
  return date.replaceAll("-", "")
}
