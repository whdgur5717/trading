import { afterEach, describe, expect, it, vi } from "vitest"
import { KisRestQueue } from "./queue"

describe("KisRestQueue", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("요청 시작 시점을 150ms 간격으로 제한한다", async () => {
    vi.useFakeTimers()
    const provider = new KisRestQueue()
    const startedAt: number[] = []
    let finishFirstRequest!: () => void
    const firstRequestFinished = new Promise<void>((resolve) => {
      finishFirstRequest = resolve
    })

    const firstRequest = provider.run(async () => {
      startedAt.push(Date.now())
      await firstRequestFinished
    })
    const secondRequest = provider.run(async () => {
      startedAt.push(Date.now())
    })

    await vi.dynamicImportSettled()
    await vi.advanceTimersByTimeAsync(0)
    expect(startedAt).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(149)
    expect(startedAt).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(1)
    expect(startedAt).toHaveLength(2)
    expect(startedAt[1] - startedAt[0]).toBe(150)

    finishFirstRequest()
    await Promise.all([firstRequest, secondRequest])
  })

  it("재시도가 허용된 요청은 대기열에서 다시 실행한다", async () => {
    const provider = new KisRestQueue()
    const request = vi.fn<() => Promise<string>>()

    request
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValueOnce("ok")

    await expect(provider.run(request, { retries: 1 })).resolves.toBe("ok")
    expect(request).toHaveBeenCalledTimes(2)
  })

  it("재시도가 허용되지 않은 요청은 최초 실패를 반환한다", async () => {
    const provider = new KisRestQueue()
    const error = new Error("temporary failure")
    const request = vi.fn<() => Promise<string>>()

    request.mockRejectedValueOnce(error)

    await expect(provider.run(request)).rejects.toBe(error)
    expect(request).toHaveBeenCalledTimes(1)
  })
})
