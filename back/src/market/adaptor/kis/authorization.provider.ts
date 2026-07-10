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
import { rest } from "./protocol"
import {
  accessTokenSchema,
  approvalKeySchema,
  responseMetaSchema,
  type AccessToken,
  type ApprovalKey,
} from "./schema"

interface TokenCache {
  value: string
  expiresAtMs: number
}

type AuthorizationError = MarketDataProviderError

@Injectable()
export class AuthorizationProvider {
  private tokenCache: TokenCache | null = null
  private tokenRequest: Promise<Result<string, AuthorizationError>> | null =
    null

  constructor(
    private readonly httpRequestProvider: HttpRequestProvider,
    private readonly config: ConfigService
  ) {}

  async accessToken(): Promise<Result<string, AuthorizationError>> {
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAtMs) {
      return ok(this.tokenCache.value)
    }

    if (this.tokenRequest) {
      return this.tokenRequest
    }

    this.tokenRequest = this.issueAccessToken()

    try {
      return await this.tokenRequest
    } finally {
      this.tokenRequest = null
    }
  }

  resetAccessToken(): void {
    this.tokenCache = null
  }

  approvalKey(): Promise<Result<ApprovalKey, AuthorizationError>> {
    return this.post(
      rest.approvalKey,
      {
        grant_type: "client_credentials",
        appkey: this.appKey,
        secretkey: this.appSecret,
      },
      approvalKeySchema
    )
  }

  private async issueAccessToken(): Promise<
    Result<string, AuthorizationError>
  > {
    const token = await this.post(
      rest.accessToken,
      {
        grant_type: "client_credentials",
        appkey: this.appKey,
        appsecret: this.appSecret,
      },
      accessTokenSchema
    )

    if (token.isErr()) {
      return err(token.error)
    }

    this.tokenCache = {
      value: token.value.access_token,
      expiresAtMs: this.expiresAtMs(token.value),
    }

    return ok(token.value.access_token)
  }

  private async post<TSchema extends z.ZodType>(
    path: string,
    body: Record<string, string>,
    schema: TSchema
  ): Promise<Result<z.output<TSchema>, AuthorizationError>> {
    let response: HttpResponse

    try {
      response = await this.httpRequestProvider.request({
        method: "POST",
        url: `${this.restBaseUrl}${path}`,
        body,
        validateStatus: (status) => status >= 200 && status < 300,
      })
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
              endpoint: path,
              upstreamStatus,
              upstreamCode,
            })
          )
        case "response":
        case "cancelled":
        case "network":
        case "client":
          return err(
            marketErrors.providerAuthUnavailable({
              provider: "kis",
              endpoint: path,
              upstreamStatus,
              upstreamCode,
            })
          )
      }
    }

    const meta = responseMetaSchema.safeParse(response.data)

    if (meta.success && meta.data.rt_cd !== "0") {
      return err(
        marketErrors.providerAuthUnavailable({
          provider: "kis",
          endpoint: path,
          upstreamStatus: response.status,
          upstreamCode: meta.data.msg_cd ?? null,
        })
      )
    }

    const parsed = schema.safeParse(response.data)

    if (!parsed.success) {
      return err(
        marketErrors.providerInvalidResponse({
          provider: "kis",
          endpoint: path,
          upstreamStatus: response.status,
          upstreamCode: null,
        })
      )
    }

    return ok(parsed.data)
  }

  private expiresAtMs(token: AccessToken): number {
    const refreshMarginMs = 60_000
    const explicitExpiresAtMs = this.dateTimeAsKstMs(
      token.access_token_token_expired
    )

    if (explicitExpiresAtMs) {
      return explicitExpiresAtMs - refreshMarginMs
    }

    return Date.now() + (token.expires_in ?? 86_400) * 1000 - refreshMarginMs
  }

  private dateTimeAsKstMs(value: string | undefined): number | null {
    if (!value) {
      return null
    }

    const trimmed = value.trim()

    if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
      const parsed = Date.parse(trimmed)
      return Number.isFinite(parsed) ? parsed : null
    }

    const match = trimmed.match(
      /^(\d{4})-?(\d{2})-?(\d{2})[ T]?(\d{2}):?(\d{2}):?(\d{2})$/
    )

    if (!match) {
      return null
    }

    const [, year, month, day, hour, minute, second] = match
    return Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour) - 9,
      Number(minute),
      Number(second)
    )
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
