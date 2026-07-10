import { HttpService } from "@nestjs/axios"
import { Injectable } from "@nestjs/common"
import {
  AxiosError,
  type AxiosRequestConfig,
  type Method,
  isAxiosError,
} from "axios"
import { firstValueFrom } from "rxjs"

export type HttpRequestErrorKind =
  | "response"
  | "timeout"
  | "cancelled"
  | "network"
  | "client"

const axiosErrorKindByCode: Partial<Record<string, HttpRequestErrorKind>> = {
  [AxiosError.ECONNABORTED]: "timeout",
  [AxiosError.ETIMEDOUT]: "timeout",
  [AxiosError.ERR_CANCELED]: "cancelled",
  [AxiosError.ERR_NETWORK]: "network",
  [AxiosError.ECONNREFUSED]: "network",
  [AxiosError.ERR_INVALID_URL]: "client",
  [AxiosError.ERR_BAD_OPTION]: "client",
  [AxiosError.ERR_BAD_OPTION_VALUE]: "client",
}

export interface HttpRequestOptions {
  method: Method
  url: string
  headers?: Record<string, string>
  query?: Record<string, string>
  body?: unknown
  signal?: AbortSignal
  validateStatus?: (status: number) => boolean
}

export interface HttpResponse {
  status: number
  statusText: string
  data: unknown
}

export class HttpRequestError extends Error {
  readonly kind: HttpRequestErrorKind
  readonly response?: HttpResponse
  readonly code?: string

  constructor(options: {
    kind: HttpRequestErrorKind
    response?: HttpResponse
    code?: string
    cause?: unknown
  }) {
    super("HTTP request failed", { cause: options.cause })
    this.name = "HttpRequestError"
    this.kind = options.kind
    this.response = options.response
    this.code = options.code
  }
}

@Injectable()
export class HttpRequestProvider {
  constructor(private readonly httpService: HttpService) {}

  async request(options: HttpRequestOptions): Promise<HttpResponse> {
    const config: AxiosRequestConfig = {
      method: options.method,
      url: options.url,
      headers: {
        "content-type": "application/json; charset=utf-8",
        ...options.headers,
      },
      params: options.query,
      data: options.body,
      signal: options.signal,
      validateStatus: options.validateStatus ?? (() => true),
    }
    const response = await firstValueFrom(
      this.httpService.request<unknown>(config)
    ).catch((error: unknown) => {
      if (!isAxiosError<unknown>(error)) {
        throw error
      }

      const response = error.response
        ? {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
          }
        : undefined

      throw new HttpRequestError({
        kind: response
          ? "response"
          : (axiosErrorKindByCode[error.code ?? ""] ?? "network"),
        response,
        code: error.code,
        cause: error,
      })
    })

    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    }
  }
}
