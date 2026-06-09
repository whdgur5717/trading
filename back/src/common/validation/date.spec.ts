import {
  createPastOrTodayIsoDateSchema,
  pastOrTodayIsoDateSchema,
} from "./date"
import { describe, expect, it } from "vitest"

describe("date validation", () => {
  it("accepts real ISO calendar dates", () => {
    expect(pastOrTodayIsoDateSchema.safeParse("2026-05-15").success).toBe(true)
    expect(pastOrTodayIsoDateSchema.safeParse("2024-02-29").success).toBe(true)
  })

  it("rejects invalid calendar dates", () => {
    expect(pastOrTodayIsoDateSchema.safeParse("2026-02-31").success).toBe(false)
    expect(pastOrTodayIsoDateSchema.safeParse("2026-99-99").success).toBe(false)
    expect(pastOrTodayIsoDateSchema.safeParse("2026-2-3").success).toBe(false)
  })

  it("rejects future dates using KST", () => {
    const now = new Date("2026-05-14T15:00:00.000Z")
    const schema = createPastOrTodayIsoDateSchema(() => now)

    expect(schema.safeParse("2026-05-15").success).toBe(true)
    expect(schema.safeParse("2026-05-16").success).toBe(false)
  })
})
