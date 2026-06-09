import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { isAxiosError } from "axios"
import { ExternalServiceError } from "../../../common/error/externalServiceError"
import {
  HttpRequestProvider,
  type HttpResponse,
} from "../../../common/http/httpRequest.provider"
import { rest } from "./protocol"
import { dataFromResponse, errorFromResponse } from "./response"
import {
  accessTokenSchema,
  approvalKeySchema,
  type AccessToken,
  type ApprovalKey,
} from "./schema"

interface TokenCache {
  value: string
  expiresAtMs: number
}

@Injectable()
export class AuthorizationProvider {
  private tokenCache: TokenCache | null = null
  private tokenRequest: Promise<string> | null = null

  constructor(
    private readonly httpRequestProvider: HttpRequestProvider,
    private readonly config: ConfigService
  ) {}

  async accessToken(): Promise<string> {
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAtMs) {
      return this.tokenCache.value
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

  approvalKey(): Promise<ApprovalKey> {
    return this.post(rest.approvalKey, {
      grant_type: "client_credentials",
      appkey: this.appKey,
      secretkey: this.appSecret,
    }).then((response) =>
      dataFromResponse(response, rest.approvalKey, approvalKeySchema)
    )
  }

  private async issueAccessToken(): Promise<string> {
    const response = await this.post(rest.accessToken, {
      grant_type: "client_credentials",
      appkey: this.appKey,
      appsecret: this.appSecret,
    })
    const token = dataFromResponse(
      response,
      rest.accessToken,
      accessTokenSchema
    )

    this.tokenCache = {
      value: token.access_token,
      expiresAtMs: this.expiresAtMs(token),
    }

    return token.access_token
  }

  private async post(
    path: string,
    body: Record<string, string>
  ): Promise<HttpResponse> {
    let response: HttpResponse

    try {
      response = await this.httpRequestProvider.request({
        method: "POST",
        url: `${this.restBaseUrl}${path}`,
        body,
      })
    } catch (error) {
      throw new ExternalServiceError(
        error instanceof Error ? error.message : "KIS authorization failed",
        {
          service: "kis",
          kind: "transport",
          endpoint: path,
          code: isAxiosError(error) ? error.code : undefined,
          cause: error,
        }
      )
    }

    const failure = errorFromResponse(response, path)

    if (failure) {
      throw failure
    }

    return response
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
