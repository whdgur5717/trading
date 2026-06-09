const locale = "ko-KR"

export const dateSeparator = "."

export const displayRules = [
  {
    divisor: 1_000_000_000_000,
    maximumFractionDigits: 1,
    minValue: 1_000_000_000_000,
    suffix: "조원",
  },
  {
    divisor: 100_000_000,
    maximumFractionDigits: 1,
    minValue: 100_000_000,
    suffix: "억원",
  },
  {
    divisor: 10_000,
    maximumFractionDigits: 0,
    minValue: 10_000_000,
    suffix: "만원",
  },
  {
    divisor: 1,
    maximumFractionDigits: 0,
    minValue: 0,
    suffix: "원",
  },
] as const

export const numberFormatter = new Intl.NumberFormat(locale, {
  maximumFractionDigits: 0,
})

export function formatWon(value: number) {
  const roundedValue = Math.round(value)
  const rule = displayRules.find(
    ({ minValue }) => Math.abs(roundedValue) >= minValue
  )!
  const formattedValue = (roundedValue / rule.divisor).toLocaleString(locale, {
    maximumFractionDigits: rule.maximumFractionDigits,
  })

  return `${formattedValue}${rule.suffix}`
}
