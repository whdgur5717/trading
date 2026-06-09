import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from "@nestjs/common"
import type { Response } from "express"
import {
  HTTP_ERROR_CODE_BY_STATUS,
  type ApiFailure,
  type HttpErrorStatus,
} from "../api/schema"
import { ExternalServiceError } from "../error/externalServiceError"

@Catch(ExternalServiceError)
export class ExternalServiceErrorFilter implements ExceptionFilter<ExternalServiceError> {
  catch(exception: ExternalServiceError, host: ArgumentsHost) {
    const context = host.switchToHttp()
    const response = context.getResponse<Response>()
    const status = this.status(exception)

    if (response.headersSent) {
      return
    }

    response.status(status).json({
      success: false,
      error: {
        status,
        code: HTTP_ERROR_CODE_BY_STATUS[status],
        message: exception.message,
        details: exception.details,
      },
    } satisfies ApiFailure)
  }

  private status(exception: ExternalServiceError): HttpErrorStatus {
    if (exception.kind === "transport" && exception.code === "ECONNABORTED") {
      return HttpStatus.GATEWAY_TIMEOUT
    }

    return HttpStatus.BAD_GATEWAY
  }
}
