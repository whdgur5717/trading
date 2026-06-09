import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { isAxiosError } from "axios"
import type { z } from "zod"
import { ExternalServiceError } from "../../../common/error/externalServiceError"
import {
  HttpRequestProvider,
  type HttpResponse,
} from "../../../common/http/httpRequest.provider"
import { AuthorizationProvider } from "./authorization.provider"
import { dataFromResponse, errorFromResponse } from "./response"

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
  ): Promise<z.output<TSchema>> {
    const accessToken = await this.authorizationProvider.accessToken()

    try {
      return await this.getWithAccessToken(api, query, accessToken, schema)
    } catch (error) {
      if (
        !(error instanceof ExternalServiceError) ||
        !this.isAccessTokenFailure(error)
      ) {
        throw error
      }
    }

    this.authorizationProvider.resetAccessToken()
    const refreshedAccessToken = await this.authorizationProvider.accessToken()

    return this.getWithAccessToken(api, query, refreshedAccessToken, schema)
  }

  private async getWithAccessToken<TSchema extends z.ZodType>(
    api: {
      path: string
      headers: Record<string, string>
    },
    query: Record<string, string>,
    accessToken: string,
    schema: TSchema
  ): Promise<z.output<TSchema>> {
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
      throw new ExternalServiceError(
        error instanceof Error ? error.message : "KIS request failed",
        {
          service: "kis",
          kind: "transport",
          endpoint: api.path,
          code: isAxiosError(error) ? error.code : undefined,
          cause: error,
        }
      )
    }

    const failure = errorFromResponse(response, api.path)

    if (failure) {
      throw failure
    }

    return dataFromResponse(response, api.path, schema)
  }

  private isAccessTokenFailure(error: ExternalServiceError): boolean {
    if (error.status === 401 || error.status === 403) {
      return true
    }

    if (error.kind !== "business") {
      return false
    }

    const message = `${error.code ?? ""} ${error.message}`.toLowerCase()
    return /token|auth|인증|토큰|만료|expired|unauthorized/.test(message)
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
