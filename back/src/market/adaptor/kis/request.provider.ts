import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { isAxiosError } from "axios"
import { err, type Result } from "neverthrow"
import type { z } from "zod"
import {
  HttpRequestProvider,
  type HttpResponse,
} from "../../../common/http/httpRequest.provider"
import { AuthorizationProvider } from "./authorization.provider"
import type { KisMarketDataFailure } from "./error"
import { dataFromResponse } from "./response"

@Injectable()
export class RequestProvider {
  constructor(
    private readonly httpRequestProvider: HttpRequestProvider,
    private readonly authorizationProvider: AuthorizationProvider,
    private readonly config: ConfigService
  ) {}

  async get<TSchema extends z.ZodType>(
    api: {
      path: string
      headers: Record<string, string>
    },
    query: Record<string, string>,
    schema: TSchema
  ): Promise<Result<z.output<TSchema>, KisMarketDataFailure>> {
    const accessToken = await this.authorizationProvider.accessToken()

    if (accessToken.isErr()) {
      return err(accessToken.error)
    }

    const first = await this.getWithAccessToken(
      api,
      query,
      accessToken.value,
      schema
    )

    if (first.isOk() || first.error.code !== "auth-unavailable") {
      return first
    }

    this.authorizationProvider.resetAccessToken()
    const refreshedAccessToken = await this.authorizationProvider.accessToken()

    if (refreshedAccessToken.isErr()) {
      return err(refreshedAccessToken.error)
    }

    return this.getWithAccessToken(
      api,
      query,
      refreshedAccessToken.value,
      schema
    )
  }

  private async getWithAccessToken<TSchema extends z.ZodType>(
    api: {
      path: string
      headers: Record<string, string>
    },
    query: Record<string, string>,
    accessToken: string,
    schema: TSchema
  ): Promise<Result<z.output<TSchema>, KisMarketDataFailure>> {
    let response: HttpResponse

    try {
      response = await this.httpRequestProvider.request({
        method: "GET",
        url: `${this.restBaseUrl}${api.path}`,
        headers: {
          appkey: this.appKey,
          appsecret: this.appSecret,
          custtype: "P",
          ...api.headers,
          authorization: `Bearer ${accessToken}`,
        },
        query,
      })
    } catch (error) {
      const code = isAxiosError(error) ? error.code : undefined
      const message =
        error instanceof Error ? error.message : "KIS request failed"

      if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
        return err({
          service: "kis",
          code: "timeout",
          message,
          endpoint: api.path,
          upstreamCode: code,
          cause: error,
        })
      }

      return err({
        service: "kis",
        code: "unavailable",
        message,
        endpoint: api.path,
        upstreamCode: code,
        cause: error,
      })
    }

    return dataFromResponse(response, api.path, schema, "market-data")
  }

  private get restBaseUrl(): string {
    return this.config.getOrThrow<string>("KIS_REST_BASE_URL")
  }

  private get appKey(): string {
    return this.config.getOrThrow<string>("APP_KEY")
  }

  private get appSecret(): string {
    return this.config.getOrThrow<string>("APP_SECRET")
  }
}
