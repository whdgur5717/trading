import type { ConfigService } from "@nestjs/config"
import { describe, expect, it, vi } from "vitest"
import { RequestQueueProvider } from "./request-queue.provider"

const config = {
  getOrThrow(key: string) {
    return {
      KIS_REST_QUEUE_CONCURRENCY: 3,
      KIS_REST_QUEUE_INTERVAL_CAP: 3,
      KIS_REST_QUEUE_INTERVAL_MS: 300,
    }[key]
  },
} as ConfigService

describe("RequestQueueProvider", () => {
  it("runs a queued request again when retry is allowed", async () => {
    const provider = new RequestQueueProvider(config)
    const request = vi.fn<() => Promise<string>>()

    request
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValueOnce("ok")

    await expect(provider.run(request, { retries: 1 })).resolves.toBe("ok")
    expect(request).toHaveBeenCalledTimes(2)
  })

  it("returns the first failure when retry is not allowed", async () => {
    const provider = new RequestQueueProvider(config)
    const error = new Error("temporary failure")
    const request = vi.fn<() => Promise<string>>()

    request.mockRejectedValueOnce(error)

    await expect(provider.run(request)).rejects.toBe(error)
    expect(request).toHaveBeenCalledTimes(1)
  })
})
