import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import type { Response } from "express"
import { Observable, mergeMap } from "rxjs"
import { commonErrors } from "../error/common.errors"
import { isDefinedError } from "../error/define"
import { type ApiFailure, type ApiSuccess } from "./schema"

export const SKIP_API_RESPONSE = "skipApiResponse"

export function SkipApiResponse() {
  return SetMetadata(SKIP_API_RESPONSE, true)
}

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccess | ApiFailure | T
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>
  ): Observable<ApiSuccess | ApiFailure | T> {
    const shouldSkip = this.reflector.getAllAndOverride<boolean>(
      SKIP_API_RESPONSE,
      [context.getHandler(), context.getClass()]
    )

    if (shouldSkip) {
      return next.handle()
    }

    const response = context.switchToHttp().getResponse<Response>()

    return next
      .handle()
      .pipe(
        mergeMap(async (data) =>
          apiResponse(await Promise.resolve(data), response)
        )
      )
  }
}

export function apiErrorBody(error: unknown): ApiFailure["error"] {
  const apiError = isDefinedError(error) ? error : commonErrors.internal({})

  return {
    type: apiError.type,
    status: apiError.status,
    message: apiError.message,
    data: apiError.data,
  }
}

type ResultLike = {
  isOk(): boolean
  isErr(): boolean
  readonly value?: unknown
  readonly error?: unknown
}

function apiResponse<T>(
  data: T,
  response: Response
): ApiSuccess | ApiFailure | T {
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

  const body = apiErrorBody(data.error)
  response.status(body.status)

  return {
    success: false as const,
    error: body,
  }
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
