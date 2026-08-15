import { Injectable, type OnModuleDestroy } from "@nestjs/common"
import type { Request, Response } from "express"
import {
  sseScenarioSchema,
  type Override,
  type SseEvent,
} from "./override.schema"

@Injectable()
export class SseStreamWriter implements OnModuleDestroy {
  private readonly streams = new Map<
    Response,
    Set<ReturnType<typeof setTimeout>>
  >()

  write(request: Request, response: Response, override: Override): void {
    const scenario = sseScenarioSchema.safeParse(override.body)

    response.status(override.status)
    response.setHeader("content-type", "text/event-stream; charset=utf-8")
    response.setHeader("cache-control", "no-cache, no-transform")
    response.setHeader("connection", "keep-alive")
    response.flushHeaders()

    if (!scenario.success) {
      this.writeEvent(response, {
        event: "error",
        data: {
          code: "INVALID_MOCK_STREAM",
          message: "Mock event-stream body must be { events: [...] }",
        },
        close: true,
      })
      return
    }

    const timers = new Set<ReturnType<typeof setTimeout>>()
    const cleanup = () => this.closeStream(response)
    this.streams.set(response, timers)
    request.on("close", cleanup)
    response.on("close", cleanup)

    for (const event of scenario.data.events) {
      const send = () => {
        if (!response.writableEnded) {
          this.writeEvent(response, event)
        }
      }
      const delayMs = event.delayMs ?? 0

      if (event.repeatMs) {
        const startTimer = setTimeout(() => {
          send()
          const interval = setInterval(send, event.repeatMs)
          timers.add(interval)
        }, delayMs)

        timers.add(startTimer)
        continue
      }

      timers.add(setTimeout(send, delayMs))
    }
  }

  reset(): void {
    for (const response of this.streams.keys()) {
      this.closeStream(response)
    }
  }

  onModuleDestroy(): void {
    this.reset()
  }

  private writeEvent(response: Response, event: SseEvent): void {
    if (event.id) {
      response.write(`id: ${event.id}\n`)
    }

    if (event.retry) {
      response.write(`retry: ${event.retry}\n`)
    }

    response.write(`event: ${event.event}\n`)
    response.write(`data: ${JSON.stringify(event.data)}\n\n`)

    if (event.close) {
      response.end()
    }
  }

  private closeStream(response: Response): void {
    const timers = this.streams.get(response)

    if (!timers) {
      return
    }

    for (const timer of timers) {
      clearTimeout(timer)
    }

    this.streams.delete(response)

    if (!response.writableEnded) {
      response.end()
    }
  }
}
