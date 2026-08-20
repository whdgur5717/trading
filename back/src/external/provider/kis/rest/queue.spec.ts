import type { ConfigService } from "@nestjs/config"
import { describe, expect, it, vi } from "vitest"
import { KisRestQueue } from "./queue"

const config = {
  getOrThrow(key: string) {
    return {
      KIS_REST_QUEUE_CONCURRENCY: 3,
      KIS_REST_QUEUE_INTERVAL_CAP: 3,
      KIS_REST_QUEUE_INTERVAL_MS: 300,
    }[key]
  },
} as ConfigService

describe("KisRestQueue", () => {
  it("재시도가 허용된 요청은 대기열에서 다시 실행한다", async () => {
    const provider = new KisRestQueue(config)
    const request = vi.fn<() => Promise<string>>()

    request
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValueOnce("ok")

    await expect(provider.run(request, { retries: 1 })).resolves.toBe("ok")
    expect(request).toHaveBeenCalledTimes(2)
  })

  it("재시도가 허용되지 않은 요청은 최초 실패를 반환한다", async () => {
    const provider = new KisRestQueue(config)
    const error = new Error("temporary failure")
    const request = vi.fn<() => Promise<string>>()

    request.mockRejectedValueOnce(error)

    await expect(provider.run(request)).rejects.toBe(error)
    expect(request).toHaveBeenCalledTimes(1)
  })
})
