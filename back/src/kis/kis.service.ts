import { BadGatewayException, Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { isError } from "es-toolkit"
import type { MarketAction, MarketPort } from "../realtime/ports/market"
import type { RealtimePriceEvent } from "../realtime/realtime.schema"
import {
  KIS_CURRENT_PRICE_PATH,
  KIS_CURRENT_PRICE_TR_ID,
  KIS_DAILY_ITEM_CHART_PRICE_PATH,
  KIS_DAILY_ITEM_CHART_PRICE_TR_ID,
  KIS_DOMESTIC_HOLIDAY_PATH,
  KIS_DOMESTIC_HOLIDAY_TR_ID,
} from "./kis.constants"
import {
  mapDailyItemChartPrice,
  mapDomesticHoliday,
  mapInquirePrice,
  mapLatestDailyClose,
  parseRealtimeTradeMessage,
} from "./kis-mappers"
import {
  kisAccessTokenResponseSchema,
  kisApprovalKeyResponseSchema,
  kisJsonObjectSchema,
  kisResponseMetaSchema,
  type KisAccessTokenResponse,
  type KisMarketCode,
} from "./kis.schema"
import type {
  CurrentPrice,
  DailyCandle,
  DailyPriceResult,
  DomesticMarketDay,
  KisDailyItemChartPriceResponse,
  KisDomesticHolidayResponse,
  KisInquirePriceResponse,
} from "./kis.schema"

interface TokenCache {
  accessToken: string
  expiresAtMs: number
}

interface ApprovalKeyCache {
  approvalKey: string
  expiresAtMs: number
}

const KIS_REQUEST_TIMEOUT_MS = 5_000

@Injectable()
export class KisService implements MarketPort {
  private tokenCache: TokenCache | null = null
  private approvalKeyCache: ApprovalKeyCache | null = null
  private tokenRequest: Promise<string> | null = null
  private approvalKeyRequest: Promise<string> | null = null

  constructor(private readonly config: ConfigService) {}

  async getCurrentPrice(
    code: string,
    marketCode = this.getDefaultMarketCode()
  ): Promise<CurrentPrice> {
    const response = await this.get<KisInquirePriceResponse>(
      KIS_CURRENT_PRICE_PATH,
      KIS_CURRENT_PRICE_TR_ID,
      {
        FID_COND_MRKT_DIV_CODE: marketCode,
        FID_INPUT_ISCD: code,
      }
    )

    return mapInquirePrice(response)
  }

  async getDailyPrice(
    code: string,
    date: string,
    marketCode = this.getDefaultMarketCode()
  ): Promise<DailyPriceResult> {
    const compactDate = date.replaceAll("-", "")
    const response = await this.get<KisDailyItemChartPriceResponse>(
      KIS_DAILY_ITEM_CHART_PRICE_PATH,
      KIS_DAILY_ITEM_CHART_PRICE_TR_ID,
      {
        FID_COND_MRKT_DIV_CODE: marketCode,
        FID_INPUT_ISCD: code,
        FID_INPUT_DATE_1: compactDate,
        FID_INPUT_DATE_2: compactDate,
        FID_PERIOD_DIV_CODE: "D",
        FID_ORG_ADJ_PRC: "0",
      }
    )

    return mapDailyItemChartPrice(response)
  }

  async getLatestDailyClose(
    code: string,
    endDate: string,
    marketCode = this.getDefaultMarketCode()
  ): Promise<DailyCandle> {
    const compactEndDate = endDate.replaceAll("-", "")
    const compactStartDate = this.subtractDays(compactEndDate, 60)
    const response = await this.get<KisDailyItemChartPriceResponse>(
      KIS_DAILY_ITEM_CHART_PRICE_PATH,
      KIS_DAILY_ITEM_CHART_PRICE_TR_ID,
      {
        FID_COND_MRKT_DIV_CODE: marketCode,
        FID_INPUT_ISCD: code,
        FID_INPUT_DATE_1: compactStartDate,
        FID_INPUT_DATE_2: compactEndDate,
        FID_PERIOD_DIV_CODE: "D",
        FID_ORG_ADJ_PRC: "0",
      }
    )
    const result = mapLatestDailyClose(response)

    if (!result.candle) {
      throw new BadGatewayException(
        `KIS daily close response is missing latest close for ${code}`
      )
    }

    return result.candle
  }

  async getDomesticMarketDay(date: string): Promise<DomesticMarketDay> {
    const compactDate = date.replaceAll("-", "")
    const response = await this.get<KisDomesticHolidayResponse>(
      KIS_DOMESTIC_HOLIDAY_PATH,
      KIS_DOMESTIC_HOLIDAY_TR_ID,
      {
        BASS_DT: compactDate,
        CTX_AREA_FK: "",
        CTX_AREA_NK: "",
      }
    )

    return mapDomesticHoliday(response, compactDate)
  }

  async getApprovalKey(): Promise<string> {
    if (
      this.approvalKeyCache &&
      Date.now() < this.approvalKeyCache.expiresAtMs
    ) {
      return this.approvalKeyCache.approvalKey
    }

    if (this.approvalKeyRequest) {
      return this.approvalKeyRequest
    }

    this.approvalKeyRequest = this.issueApprovalKey()

    try {
      return await this.approvalKeyRequest
    } finally {
      this.approvalKeyRequest = null
    }
  }

  private async issueApprovalKey(): Promise<string> {
    const response = await this.fetchKis(
      `${this.getRestBaseUrl()}/oauth2/Approval`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          appkey: this.getAppKey(),
          secretkey: this.getAppSecret(),
        }),
      }
    )

    const body = await this.readJson(response)

    if (!response.ok) {
      throw new BadGatewayException(
        this.getKisMessage(body) || "KIS approval key request failed"
      )
    }

    const approval = this.parseKisApprovalKeyResponse(body)
    this.approvalKeyCache = {
      approvalKey: approval.approval_key,
      expiresAtMs: Date.now() + 23 * 60 * 60 * 1000,
    }

    return approval.approval_key
  }

  getUrl(): string {
    return this.config.getOrThrow<string>("KIS_WS_URL")
  }

  async getAuthKey(): Promise<string> {
    return this.getApprovalKey()
  }

  parseMessage(raw: string): RealtimePriceEvent | null {
    return parseRealtimeTradeMessage(raw)
  }

  createSubscriptionMessage(params: {
    action: MarketAction
    authKey: string
    stockCode: string
  }): string {
    return JSON.stringify({
      header: {
        approval_key: params.authKey,
        custtype: "P",
        tr_type: params.action === "subscribe" ? "1" : "2",
        "content-type": "utf-8",
      },
      body: {
        input: {
          tr_id: this.config.getOrThrow<string>("KIS_REALTIME_TR_ID"),
          tr_key: params.stockCode,
        },
      },
    })
  }

  private async get<T>(
    path: string,
    trId: string,
    query: Record<string, string>
  ): Promise<T> {
    const url = new URL(`${this.getRestBaseUrl()}${path}`)
    url.search = new URLSearchParams(query).toString()

    return this.getWithAccessToken<T>(url, trId, false)
  }

  private async getWithAccessToken<T>(
    url: URL,
    trId: string,
    hasRetried: boolean
  ): Promise<T> {
    const token = await this.getAccessToken()
    const response = await this.fetchKis(url, {
      method: "GET",
      headers: {
        "content-type": "application/json; charset=utf-8",
        authorization: `Bearer ${token}`,
        appkey: this.getAppKey(),
        appsecret: this.getAppSecret(),
        tr_id: trId,
        custtype: "P",
      },
    })

    const body = await this.readJson(response)
    const meta = kisResponseMetaSchema.safeParse(body)

    if (!hasRetried && this.isKisAuthFailure(response.status, body)) {
      this.clearAccessTokenCache()
      return this.getWithAccessToken<T>(url, trId, true)
    }

    if (!response.ok || (meta.success && meta.data.rt_cd === "1")) {
      throw new BadGatewayException(
        (meta.success ? meta.data.msg1 : undefined) ||
          `KIS request failed: ${trId}`
      )
    }

    return body as T
  }

  private async getAccessToken(): Promise<string> {
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAtMs) {
      return this.tokenCache.accessToken
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

  private clearAccessTokenCache(): void {
    this.tokenCache = null
  }

  private async issueAccessToken(): Promise<string> {
    const response = await this.fetchKis(
      `${this.getRestBaseUrl()}/oauth2/tokenP`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          appkey: this.getAppKey(),
          appsecret: this.getAppSecret(),
        }),
      }
    )

    const body = await this.readJson(response)

    if (!response.ok) {
      throw new BadGatewayException(
        this.getKisMessage(body) || "KIS access token request failed"
      )
    }

    const token = this.parseKisAccessTokenResponse(body)
    this.tokenCache = {
      accessToken: token.access_token,
      expiresAtMs: this.resolveAccessTokenExpiresAtMs(token),
    }

    return token.access_token
  }

  private async fetchKis(
    input: string | URL,
    init: RequestInit
  ): Promise<Response> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), KIS_REQUEST_TIMEOUT_MS)

    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal,
      })
    } catch (error) {
      if (isError(error) && error.name === "AbortError") {
        throw new BadGatewayException("KIS request timed out")
      }

      throw new BadGatewayException("KIS request failed")
    } finally {
      clearTimeout(timeout)
    }
  }

  private isKisAuthFailure(
    status: number,
    body: Record<string, unknown>
  ): boolean {
    if (status === 401 || status === 403) {
      return true
    }

    const meta = kisResponseMetaSchema.safeParse(body)

    if (!meta.success) {
      return false
    }

    const { rt_cd, msg_cd, msg1 } = meta.data
    const message = `${msg_cd} ${msg1}`.toLowerCase()
    return (
      rt_cd === "1" &&
      /token|auth|인증|토큰|만료|expired|unauthorized/.test(message)
    )
  }

  private getKisMessage(body: Record<string, unknown>): string | undefined {
    return kisResponseMetaSchema.safeParse(body).data?.msg1
  }

  private parseKisAccessTokenResponse(
    body: Record<string, unknown>
  ): KisAccessTokenResponse {
    const result = kisAccessTokenResponseSchema.safeParse(body)

    if (!result.success) {
      throw new BadGatewayException("KIS access token response is invalid")
    }

    return result.data
  }

  private parseKisApprovalKeyResponse(body: Record<string, unknown>): {
    approval_key: string
  } {
    const result = kisApprovalKeyResponseSchema.safeParse(body)

    if (!result.success) {
      throw new BadGatewayException("KIS approval key response is invalid")
    }

    return result.data
  }

  private resolveAccessTokenExpiresAtMs(body: KisAccessTokenResponse): number {
    const refreshMarginMs = 60 * 1000
    const explicitExpiresAtMs = this.parseKisDateTimeAsKstMs(
      body.access_token_token_expired
    )

    if (explicitExpiresAtMs) {
      return explicitExpiresAtMs - refreshMarginMs
    }

    const expiresInSeconds = Number(body.expires_in || 86_400)
    return Date.now() + expiresInSeconds * 1000 - refreshMarginMs
  }

  private parseKisDateTimeAsKstMs(value: string | undefined): number | null {
    if (!value) {
      return null
    }

    const trimmedValue = value.trim()

    if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmedValue)) {
      const parsedWithTimezone = Date.parse(trimmedValue)
      return Number.isFinite(parsedWithTimezone) ? parsedWithTimezone : null
    }

    const match = trimmedValue.match(
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

  private subtractDays(compactDate: string, days: number): string {
    const match = compactDate.match(/^(\d{4})(\d{2})(\d{2})$/)

    if (!match) {
      throw new BadGatewayException(`Invalid KIS date: ${compactDate}`)
    }

    const [, year, month, day] = match
    const date = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day))
    )

    date.setUTCDate(date.getUTCDate() - days)

    return [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, "0"),
      String(date.getUTCDate()).padStart(2, "0"),
    ].join("")
  }

  private async readJson(response: Response): Promise<Record<string, unknown>> {
    const text = await response.text()
    let parsed: unknown

    try {
      parsed = JSON.parse(text)
    } catch {
      throw new BadGatewayException(`KIS returned non-JSON response: ${text}`)
    }

    const result = kisJsonObjectSchema.safeParse(parsed)

    if (!result.success) {
      throw new BadGatewayException(
        `KIS returned invalid JSON response: ${text}`
      )
    }

    return result.data
  }

  private getRestBaseUrl(): string {
    return this.config.getOrThrow<string>("KIS_REST_BASE_URL")
  }

  private getDefaultMarketCode(): KisMarketCode {
    return this.config.getOrThrow<KisMarketCode>("KIS_MARKET_CODE")
  }

  private getAppKey(): string {
    return this.config.getOrThrow<string>("APP_KEY")
  }

  private getAppSecret(): string {
    return this.config.getOrThrow<string>("APP_SECRET")
  }
}
