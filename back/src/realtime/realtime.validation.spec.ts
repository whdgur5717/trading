import { describe, expect, it } from "vitest"
import { parseRequestedSymbols } from "./realtime.validation"

describe("parseRequestedSymbols", () => {
  it("공백과 중복을 제거한 여섯 자리 종목 코드만 반환한다", () => {
    expect(
      parseRequestedSymbols("005930, 000660,005930")._unsafeUnwrap()
    ).toEqual(["005930", "000660"])
  })

  it("여섯 자리가 아닌 종목 코드를 거부한다", () => {
    expect(parseRequestedSymbols("5930").isErr()).toBe(true)
  })
})
