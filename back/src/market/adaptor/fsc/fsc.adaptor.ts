import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { isAxiosError } from "axios"
import { err, type Result } from "neverthrow"
import type { z } from "zod"
import {
  HttpRequestProvider,
  type HttpResponse,
} from "../../../common/http/httpRequest.provider"
import type { DailyMarketIndex, DailyStockPrice } from "../../market.schema"
import type { MarketDataError } from "../../market-data.error"
import { FSC_BASE_URL, fscRest } from "./fsc.protocol"
import {
  fscMarketIndexResponseSchema,
  fscStockPriceResponseSchema,
} from "./fsc.schema"
import { toFscMarketError } from "./fsc.error"
import { dataFromFscResponse } from "./fsc.response"

@Injectable()
export class FscAdaptor {
  constructor(
    private readonly httpRequestProvider: HttpRequestProvider,
    private readonly config: ConfigService
  ) {}

  dailyStocks(
    date: string
  ): Promise<Result<DailyStockPrice[], MarketDataError>> {
    return this.get(
      fscRest.stockPriceInfo,
      { basDt: compactDate(date), numOfRows: "5000", pageNo: "1" },
      fscStockPriceResponseSchema
    ).then((result) =>
      result.map((response) => response.response.body.items?.item ?? [])
    )
  }

  dailyIndexes(
    date: string
  ): Promise<Result<DailyMarketIndex[], MarketDataError>> {
    return this.get(
      fscRest.marketIndexInfo,
      { basDt: compactDate(date), numOfRows: "200", pageNo: "1" },
      fscMarketIndexResponseSchema
    ).then((result) =>
      result.map((response) => response.response.body.items?.item ?? [])
    )
  }

  private async get<TSchema extends z.ZodType>(
    path: string,
    query: Record<string, string>,
    schema: TSchema
  ): Promise<Result<z.output<TSchema>, MarketDataError>> {
    let response: HttpResponse

    try {
      response = await this.httpRequestProvider.request({
        method: "GET",
        url: `${FSC_BASE_URL}${path}`,
        query: {
          serviceKey: this.serviceKey,
          resultType: "json",
          ...query,
        },
      })
    } catch (error) {
      const code = isAxiosError(error) ? error.code : undefined
      const message =
        error instanceof Error ? error.message : "FSC request failed"
      const failureCode =
        code === "ECONNABORTED" || code === "ETIMEDOUT"
          ? "timeout"
          : "unavailable"

      return err(
        toFscMarketError({
          service: "fsc",
          code: failureCode,
          message,
          endpoint: path,
          upstreamCode: code,
          cause: error,
        })
      )
    }

    return dataFromFscResponse(response, path, schema).mapErr(toFscMarketError)
  }

  private get serviceKey(): string {
    return this.config.getOrThrow<string>("PUBLIC_DATA_SERVICE_KEY")
  }
}

function compactDate(date: string): string {
  return date.replaceAll("-", "")
}
