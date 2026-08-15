import { Injectable, type NestMiddleware } from "@nestjs/common"
import type { NextFunction, Request, Response } from "express"
import { overrideSchema } from "./override.schema"
import { OverrideStore } from "./override.store"
import { SseStreamWriter } from "./sse-stream.writer"

@Injectable()
export class OverrideMiddleware implements NestMiddleware {
  constructor(
    private readonly store: OverrideStore,
    private readonly sse: SseStreamWriter
  ) {}

  async use(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    if (request.path === "/__mock/overrides" && request.method === "GET") {
      response.status(200).json({ overrides: this.store.list() })
      return
    }

    if (request.path === "/__mock/overrides" && request.method === "PUT") {
      const parsed = overrideSchema.safeParse(request.body)

      if (!parsed.success) {
        response.status(400).json({ message: "Invalid mock override payload" })
        return
      }

      this.store.set(parsed.data)
      response.status(200).json({
        operationId: parsed.data.operationId,
        override: parsed.data,
      })
      return
    }

    if (request.path === "/__mock/overrides" && request.method === "DELETE") {
      const operationId =
        typeof request.query.operationId === "string"
          ? request.query.operationId
          : ""

      if (!operationId) {
        response.status(400).json({ message: "operationId is required" })
        return
      }

      this.store.delete(operationId)
      response.status(200).json({ operationId, override: null })
      return
    }

    if (request.path.startsWith("/__mock/")) {
      response.status(404).json({ message: "Not found" })
      return
    }

    const override = this.store.match(request.method, request.path)

    if (!override) {
      next()
      return
    }

    if (override.delayMs && override.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, override.delayMs))
    }

    if (override.contentType === "application/json") {
      response.status(override.status).json(override.body)
      return
    }

    this.sse.write(request, response, override)
  }
}
