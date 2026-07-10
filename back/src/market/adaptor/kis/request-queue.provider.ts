import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import type PQueue from "p-queue"

export interface RequestQueueOptions {
  priority?: number
  retries?: number
  retryDelayMs?: number
  signal?: AbortSignal
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

@Injectable()
export class RequestQueueProvider {
  private queue: Promise<PQueue> | null = null

  constructor(private readonly config: ConfigService) {}

  async run<T>(
    task: (signal?: AbortSignal) => Promise<T>,
    options: RequestQueueOptions = {}
  ): Promise<T> {
    return this.runAttempt(task, options, 0)
  }

  private async runAttempt<T>(
    task: (signal?: AbortSignal) => Promise<T>,
    options: RequestQueueOptions,
    attempt: number
  ): Promise<T> {
    const queue = await this.getQueue()

    try {
      return await queue.add(({ signal }) => task(signal), {
        priority: options.priority ?? 0,
        signal: options.signal,
      })
    } catch (error) {
      if (options.signal?.aborted) {
        throw error
      }

      if (attempt >= (options.retries ?? 0)) {
        throw error
      }

      if (options.retryDelayMs && options.retryDelayMs > 0) {
        await sleep(options.retryDelayMs)
      }

      return this.runAttempt(task, options, attempt + 1)
    }
  }

  private getQueue(): Promise<PQueue> {
    this.queue ??= this.createQueue()

    return this.queue
  }

  private async createQueue(): Promise<PQueue> {
    const { default: PQueue } = await import("p-queue")

    return new PQueue({
      concurrency: this.config.getOrThrow<number>("KIS_REST_QUEUE_CONCURRENCY"),
      intervalCap: this.config.getOrThrow<number>(
        "KIS_REST_QUEUE_INTERVAL_CAP"
      ),
      interval: this.config.getOrThrow<number>("KIS_REST_QUEUE_INTERVAL_MS"),
      strict: true,
    })
  }
}
