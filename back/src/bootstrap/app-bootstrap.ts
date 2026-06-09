import { Reflector } from "@nestjs/core"
import type { NestExpressApplication } from "@nestjs/platform-express"
import {
  ApiExceptionFilter,
  ApiResponseInterceptor,
} from "../common/api/response"
import { ExternalServiceErrorFilter } from "../common/filter/externalServiceError"

const LOCAL_WEB_ORIGIN_PATTERN = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/

export function configureApp(app: NestExpressApplication): void {
  app.enableShutdownHooks()
  app.disable("x-powered-by")
  app.enableCors({
    origin(origin, callback) {
      callback(null, !origin || LOCAL_WEB_ORIGIN_PATTERN.test(origin))
    },
  })
  app.useGlobalInterceptors(new ApiResponseInterceptor(app.get(Reflector)))
  app.useGlobalFilters(
    new ExternalServiceErrorFilter(),
    new ApiExceptionFilter()
  )
}
