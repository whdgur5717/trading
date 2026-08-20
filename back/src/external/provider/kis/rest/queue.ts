import { Injectable } from "@nestjs/common"
import type PQueue from "p-queue"

export interface KisRestQueueOptions {
  priority?: number
  retries?: number
  retryDelayMs?: number
  signal?: AbortSignal
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Applies KIS REST concurrency and interval limits before requests reach KIS. */
@Injectable()
export class KisRestQueue {
  private queue: Promise<PQueue> | null = null

  async run<T>(
    task: (signal?: AbortSignal) => Promise<T>,
    options: KisRestQueueOptions = {}
  ): Promise<T> {
    return this.runAttempt(task, options, 0)
  }

  private async runAttempt<T>(
    task: (signal?: AbortSignal) => Promise<T>,
    options: KisRestQueueOptions,
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
    // TODO: Replace with a static import after migrating the backend to ESM.
    const { default: PQueue } = await import("p-queue")

    return new PQueue({
      concurrency: 3,
      intervalCap: 1,
      interval: 150,
      strict: true,
    })
  }
}
