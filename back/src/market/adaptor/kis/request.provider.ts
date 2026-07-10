import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { err, ok, type Result } from "neverthrow"
import type { z } from "zod"
import {
  HttpRequestError,
  HttpRequestProvider,
  type HttpResponse,
} from "../../../common/http/httpRequest.provider"
import {
  marketErrors,
  type MarketDataProviderError,
} from "../../market-data.error"
import { AuthorizationProvider } from "./authorization.provider"
import {
  RequestQueueProvider,
  type RequestQueueOptions,
} from "./request-queue.provider"
import { responseMetaSchema } from "./schema"

@Injectable()
export class RequestProvider {
  constructor(
    private readonly httpRequestProvider: HttpRequestProvider,
    private readonly authorizationProvider: AuthorizationProvider,
    private readonly requestQueueProvider: RequestQueueProvider,
    private readonly config: ConfigService
  ) {}

  async get<TSchema extends z.ZodType>(
    api: {
      path: string
      headers: Record<string, string>
    },
    query: Record<string, string>,
    schema: TSchema,
    options: RequestQueueOptions = {}
  ): Promise<Result<z.output<TSchema>, MarketDataProviderError>> {
    const accessToken = await this.authorizationProvider.accessToken()

    if (accessToken.isErr()) {
      return err(accessToken.error)
    }

    const first = await this.getWithAccessToken(
      api,
      query,
      accessToken.value,
      schema,
      options
    )

    if (
      first.isOk() ||
      first.error.type !== "market.provider_auth_unavailable"
    ) {
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
      schema,
      options
    )
  }

  private async getWithAccessToken<TSchema extends z.ZodType>(
    api: {
      path: string
      headers: Record<string, string>
    },
    query: Record<string, string>,
    accessToken: string,
    schema: TSchema,
    options: RequestQueueOptions
  ): Promise<Result<z.output<TSchema>, MarketDataProviderError>> {
    let response: HttpResponse

    try {
      response = await this.requestQueueProvider.run(
        (signal) =>
          this.httpRequestProvider.request({
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
            signal,
            validateStatus: (status) => status >= 200 && status < 300,
          }),
        options
      )
    } catch (error) {
      if (!(error instanceof HttpRequestError)) {
        throw error
      }

      const upstreamStatus = error.response?.status ?? null
      const upstreamCode = error.code ?? null

      switch (error.kind) {
        case "timeout":
          return err(
            marketErrors.providerTimeout({
              provider: "kis",
              endpoint: api.path,
              upstreamStatus,
              upstreamCode,
            })
          )
        case "response":
          return err(
            (upstreamStatus === 401 || upstreamStatus === 403
              ? marketErrors.providerAuthUnavailable
              : marketErrors.providerUnavailable)({
              provider: "kis",
              endpoint: api.path,
              upstreamStatus,
              upstreamCode,
            })
          )
        case "cancelled":
        case "network":
        case "client":
          return err(
            marketErrors.providerUnavailable({
              provider: "kis",
              endpoint: api.path,
              upstreamStatus,
              upstreamCode,
            })
          )
      }
    }

    const meta = responseMetaSchema.safeParse(response.data)

    if (meta.success && meta.data.rt_cd !== "0") {
      const upstreamCode = meta.data.msg_cd ?? null
      const upstreamMessage = meta.data.msg1 ?? null

      return err(
        (/token|auth|인증|토큰|만료|expired|unauthorized/.test(
          `${upstreamCode ?? ""} ${upstreamMessage ?? ""}`.toLowerCase()
        )
          ? marketErrors.providerAuthUnavailable
          : marketErrors.providerUnavailable)({
          provider: "kis",
          endpoint: api.path,
          upstreamStatus: response.status,
          upstreamCode,
        })
      )
    }

    const parsed = schema.safeParse(response.data)

    if (!parsed.success) {
      return err(
        marketErrors.providerInvalidResponse({
          provider: "kis",
          endpoint: api.path,
          upstreamStatus: response.status,
          upstreamCode: null,
        })
      )
    }

    return ok(parsed.data)
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
