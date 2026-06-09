import { HttpService } from "@nestjs/axios"
import { Injectable } from "@nestjs/common"
import { type AxiosRequestConfig, type Method } from "axios"
import { firstValueFrom } from "rxjs"

export interface HttpRequestOptions {
  method: Method
  url: string
  headers?: Record<string, string>
  query?: Record<string, string>
  body?: unknown
}

export interface HttpResponse {
  status: number
  statusText: string
  data: unknown
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
    }
    const response = await firstValueFrom(
      this.httpService.request<unknown>(config)
    )

    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    }
  }
}
