import { ArgumentsHost, Catch } from "@nestjs/common"
import type { Response } from "express"
import { apiErrorBody } from "./response"
import type { ApiFailure } from "./schema"

@Catch()
export class ApiFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>()

    if (response.headersSent) {
      return
    }

    const error = apiErrorBody(exception)

    response.status(error.status).json({
      success: false,
      error,
    } satisfies ApiFailure)
  }
}
