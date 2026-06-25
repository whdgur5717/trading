import { Reflector } from "@nestjs/core"
import type { NestExpressApplication } from "@nestjs/platform-express"
import { ApiFilter } from "../common/api/filter"
import { ApiResponseInterceptor } from "../common/api/response"

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
  app.useGlobalFilters(new ApiFilter())
}
