import {
  ArgumentsHost,
  CallHandler,
  Catch,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import type { Response } from "express"
import { STATUS_CODES } from "node:http"
import { Observable, map } from "rxjs"
import {
  HTTP_ERROR_CODE_BY_STATUS,
  exceptionResponseSchema,
  isHttpErrorStatus,
  type ApiFailure,
  type ApiSuccess,
  type ExceptionResponseBody,
  type HttpErrorStatus,
} from "./schema"

export const SKIP_API_RESPONSE = "skipApiResponse"

export function SkipApiResponse() {
  return SetMetadata(SKIP_API_RESPONSE, true)
}

export function resolveApiStatus(exception: unknown): HttpErrorStatus {
  if (exception instanceof HttpException) {
    const status = exception.getStatus()

    if (isHttpErrorStatus(status)) {
      return status
    }
  }

  return HttpStatus.INTERNAL_SERVER_ERROR
}

export function resolveApiError(
  exception: unknown,
  status: HttpErrorStatus,
  fallbackMessage = "Internal server error"
): ApiFailure["error"] {
  const code = HTTP_ERROR_CODE_BY_STATUS[status]

  if (!(exception instanceof HttpException)) {
    return {
      status,
      code,
      message: fallbackMessage,
    }
  }

  const exceptionResponse = exception.getResponse()
  const message = exception.message || STATUS_CODES[status] || fallbackMessage

  if (typeof exceptionResponse === "string") {
    return {
      status,
      code,
      message: exceptionResponse,
    }
  }

  const bodyResult = exceptionResponseSchema.safeParse(exceptionResponse)

  if (!bodyResult.success) {
    return {
      status,
      code,
      message,
    }
  }

  const body = bodyResult.data
  const details = body.issues ?? body.details

  return {
    status,
    code,
    message: resolveApiMessage(body.message, message),
    ...(details === undefined ? {} : { details }),
  }
}

function resolveApiMessage(
  value: ExceptionResponseBody["message"],
  fallback: string
): string {
  if (typeof value === "string") {
    return value
  }

  if (Array.isArray(value)) {
    return value.join(", ")
  }

  return fallback
}

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccess<T> | T
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>
  ): Observable<ApiSuccess<T> | T> {
    const shouldSkip = this.reflector.getAllAndOverride<boolean>(
      SKIP_API_RESPONSE,
      [context.getHandler(), context.getClass()]
    )

    if (shouldSkip) {
      return next.handle()
    }

    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data,
      }))
    )
  }
}

@Catch()
export class ApiExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp()
    const response = context.getResponse<Response>()
    const status = this.resolveStatus(exception)

    if (response.headersSent) {
      return
    }

    response.status(status).json({
      success: false,
      error: resolveApiError(exception, status),
    } satisfies ApiFailure)
  }

  private resolveStatus(exception: unknown): HttpErrorStatus {
    return resolveApiStatus(exception)
  }
}
