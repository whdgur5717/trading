import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common"
import { HttpAdapterHost } from "@nestjs/core"
import type { Request, Response } from "express"
import { commonErrors } from "../error/common.errors"
import { isDefinedError } from "../error/define"
import type { RequestLocals } from "./request-locals"
import type { ApiFailure } from "./schema"

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name)

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp()
    const request = context.getRequest<Request>()
    const response = context.getResponse<Response<unknown, RequestLocals>>()
    const httpExceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined
    const definedError = isDefinedError(httpExceptionResponse)
      ? httpExceptionResponse
      : undefined
    const statusCode =
      definedError?.status ??
      (exception instanceof HttpException ? exception.getStatus() : 500)
    const { requestId, requestStartedAt } = response.locals
    const requestLog = {
      requestId,
      method: request.method,
      path: request.path,
      statusCode,
      durationMs: Date.now() - requestStartedAt,
    }

    if (definedError) {
      this.writeLog(statusCode, {
        ...requestLog,
        errorType: definedError.type,
        errorData: definedError.data,
      })
    } else {
      const error = exception instanceof Error ? exception : undefined
      const cause = error?.cause instanceof Error ? error.cause : undefined

      this.writeLog(statusCode, {
        ...requestLog,
        exceptionName: error?.name ?? typeof exception,
        exceptionMessage: error?.message ?? String(exception),
        stack: error?.stack,
        causeName: cause?.name,
        causeMessage: cause?.message,
      })
    }

    const { httpAdapter } = this.httpAdapterHost
    if (httpAdapter.isHeadersSent(response)) {
      return
    }

    if (definedError) {
      httpAdapter.reply(
        response,
        {
          success: false,
          error: {
            type: definedError.type,
            status: definedError.status,
            message: definedError.message,
            data: definedError.data,
          },
        } satisfies ApiFailure,
        definedError.status
      )
      return
    }

    if (exception instanceof HttpException) {
      httpAdapter.reply(response, exception.getResponse(), statusCode)
      return
    }

    const internal = commonErrors.internal({})
    httpAdapter.reply(
      response,
      {
        success: false,
        error: {
          type: internal.type,
          status: internal.status,
          message: internal.message,
          data: internal.data,
        },
      } satisfies ApiFailure,
      internal.status
    )
  }

  private writeLog(statusCode: number, message: Record<string, unknown>): void {
    if (statusCode >= 500) {
      this.logger.error(message)
      return
    }

    this.logger.warn(message)
  }
}
