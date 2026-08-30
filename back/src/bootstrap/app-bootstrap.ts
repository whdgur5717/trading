import { randomUUID } from "node:crypto"
import type { NestExpressApplication } from "@nestjs/platform-express"
import type { NextFunction, Request, Response } from "express"
import type { RequestLocals } from "../common/api/request-locals"

const LOCAL_WEB_ORIGIN_PATTERN = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/

export function configureApp(app: NestExpressApplication): void {
  app.enableShutdownHooks()
  app.disable("x-powered-by")
  app.use(
    (
      _request: Request,
      response: Response<unknown, RequestLocals>,
      next: NextFunction
    ) => {
      const requestId = randomUUID()

      response.locals.requestId = requestId
      response.locals.requestStartedAt = Date.now()
      response.setHeader("x-request-id", requestId)
      next()
    }
  )
  app.enableCors({
    origin(origin, callback) {
      callback(null, !origin || LOCAL_WEB_ORIGIN_PATTERN.test(origin))
    },
  })
}
