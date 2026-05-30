import { createAutocomplete } from "./autocomplete"
import { describe, expect, it } from "vitest"

describe("검색어 자동완성", () => {
  const autocomplete = createAutocomplete([
    item("005930", "삼성전자", "KOSPI"),
    item("005935", "삼성전자우", "KOSPI"),
    item("009150", "삼성전기", "KOSPI"),
    item("032830", "삼성생명", "KOSPI"),
    item("145990", "삼양식품", "KOSPI"),
    item("038540", "상상인", "KOSDAQ"),
    item("055550", "신한지주", "KOSPI"),
    item("000660", "SK하이닉스", "KOSPI"),
    item("005380", "현대차", "KOSPI"),
    item("Q500001", "신한 레버리지 WTI원유 선물 ETN", "KOSPI"),
  ])

  it("초성 입력을 종목명 후보에 매칭한다", () => {
    const result = autocomplete
      .suggest("ㅅ", 20)
      .items.map((item) => item.label)

    expect(result).toContain("삼성전자")
    expect(result).toContain("삼성전기")
    expect(result).toContain("삼성생명")
    expect(result).toContain("삼양식품")
    expect(result).toContain("상상인")
    expect(result).toContain("신한지주")
    expect(result).not.toContain("현대차")
  })

  it("연속된 초성은 종목명 앞글자들의 초성 순서로 해석한다", () => {
    expect(
      autocomplete.suggest("ㅅㅅ", 20).items.map((item) => item.label)
    ).toEqual(["삼성생명", "삼성전기", "삼성전자", "삼성전자우", "상상인"])
  })

  it("종목명 일부와 초성을 섞어 입력해도 종목명 후보를 찾는다", () => {
    expect(
      autocomplete.suggest("삼ㅅ", 20).items.map((item) => item.label)
    ).toEqual(["삼성생명", "삼성전기", "삼성전자", "삼성전자우"])

    expect(
      autocomplete.suggest("삼성ㅈ", 20).items.map((item) => item.label)
    ).toEqual(["삼성전기", "삼성전자", "삼성전자우"])
  })

  it("종목코드를 입력하면 해당 종목코드로 시작하는 후보를 반환한다", () => {
    expect(autocomplete.suggest("0059", 20).items).toEqual([
      item("005930", "삼성전자", "KOSPI"),
      item("005935", "삼성전자우", "KOSPI"),
    ])
  })

  it("영문이 포함된 종목코드도 대소문자와 관계없이 찾는다", () => {
    expect(autocomplete.suggest("q5", 20).items).toEqual([
      item("Q500001", "신한 레버리지 WTI원유 선물 ETN", "KOSPI"),
    ])
  })

  it("입력 중간의 공백은 검색에 영향을 주지 않는다", () => {
    expect(
      autocomplete.suggest(" 삼 성 ㅈ ", 20).items.map((item) => item.label)
    ).toEqual(["삼성전기", "삼성전자", "삼성전자우"])
  })

  it("요청한 개수보다 후보가 많으면 다음 후보가 있음을 알려준다", () => {
    const result = autocomplete.suggest("ㅅ", 2)

    expect(result.items).toHaveLength(2)
    expect(result.hasMore).toBe(true)
  })

  it("빈 입력이나 잘못된 개수 요청에는 후보를 반환하지 않는다", () => {
    expect(autocomplete.suggest("   ", 10)).toEqual({
      items: [],
      hasMore: false,
    })

    expect(autocomplete.suggest("삼성", 0)).toEqual({
      items: [],
      hasMore: false,
    })
  })
})

function item(id: string, label: string, market: string) {
  return {
    id,
    label,
    value: label,
    metadata: {
      code: id,
      market,
    },
  }
}
