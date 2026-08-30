import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common"
import type { Request, Response } from "express"
import { Observable, mergeMap } from "rxjs"
import { isDefinedError } from "../error/define"
import type { RequestLocals } from "./request-locals"
import type { ApiSuccess } from "./schema"

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccess | T
> {
  private readonly logger = new Logger(ApiResponseInterceptor.name)

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>
  ): Observable<ApiSuccess | T> {
    const request = context.switchToHttp().getRequest<Request>()
    const response = context
      .switchToHttp()
      .getResponse<Response<unknown, RequestLocals>>()
    const { requestId, requestStartedAt } = response.locals

    return next.handle().pipe(
      mergeMap(async (data) => {
        const body = apiResponse(await Promise.resolve(data))

        this.logger.log({
          requestId,
          method: request.method,
          path: request.path,
          statusCode: response.statusCode,
          durationMs: Date.now() - requestStartedAt,
        })

        return body
      })
    )
  }
}

type ResultLike = {
  isOk(): boolean
  isErr(): boolean
  readonly value?: unknown
  readonly error?: unknown
}

function apiResponse<T>(data: T): ApiSuccess | T {
  if (!isResultLike(data)) {
    return {
      success: true as const,
      data,
    }
  }

  if (data.isOk()) {
    return {
      success: true as const,
      data: data.value,
    }
  }

  if (isDefinedError(data.error)) {
    throw new HttpException(data.error, data.error.status)
  }

  throw data.error
}

function isResultLike(value: unknown): value is ResultLike {
  if (!value || typeof value !== "object") {
    return false
  }

  return (
    "isOk" in value &&
    typeof value.isOk === "function" &&
    "isErr" in value &&
    typeof value.isErr === "function"
  )
}
