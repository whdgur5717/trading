import type {
  DailyMarketIndex,
  DailyStockPrice,
  FinancialAccount,
  MarketDisclosure,
} from "../market/market.schema"
import type { Stock } from "../stocks/stock.schema"
import type { JobjuGrade, JobjuScore, JobjuSignal } from "./jobju.schema"
import { POLICY, type SupportedMarket } from "./policy"

type TradingDay = {
  readonly target: DailyStockPrice
  readonly sameMarket: readonly [DailyStockPrice, ...DailyStockPrice[]]
  readonly indexes: readonly DailyMarketIndex[]
}

export type TradingWindow = readonly [TradingDay, ...TradingDay[]]

type StockForScoring = Stock & {
  readonly marketName: SupportedMarket
}

export type ScoringInput = {
  readonly stock: StockForScoring
  readonly tradingDays: TradingWindow
  readonly financialAccounts: readonly FinancialAccount[]
  readonly disclosures: readonly MarketDisclosure[]
}

export function calculateScore(input: ScoringInput): JobjuScore {
  const priceVolatility = scorePriceVolatility(input.tradingDays)
  const liquidity = scoreLiquidity(input.stock, input.tradingDays)
  const marketSize = scoreMarketSize(input.stock, input.tradingDays)
  const marketSensitivity = scoreMarketSensitivity(input)
  const statusFlags = scoreStatusFlags(input.stock)
  const financialDisclosure = scoreFinancialDisclosure(
    input.financialAccounts,
    input.disclosures
  )
  const signals = [
    priceVolatility,
    liquidity.signal,
    marketSize.signal,
    marketSensitivity,
    statusFlags.signal,
    financialDisclosure.signal,
  ]
  const score = applyLargeStockCap({
    rawScore: signals.reduce((total, signal) => total + signal.score, 0),
    marketCapTopPercent: marketSize.marketCapTopPercent,
    tradeValueTopPercent: liquidity.tradeValueTopPercent,
    hasStatusProblem: statusFlags.hasProblem,
    hasFinancialProblem: financialDisclosure.hasProblem,
  })
  const grade = gradeFor(score)

  return {
    stock: {
      symbol: input.stock.symbol,
      name: input.stock.name,
      marketName: input.stock.marketName,
    },
    asOfDate: input.tradingDays[0].target.date,
    sampleDays: input.tradingDays.length,
    score,
    grade,
    label: gradePolicy(grade).label,
    summary: gradePolicy(grade).summary,
    signals,
  }
}

function scorePriceVolatility(tradingDays: TradingWindow): JobjuSignal {
  const targetReturnVolatility = standardDeviation(
    tradingDays.map((day) => day.target.dailyReturnPct)
  )
  const peerReturnVolatilities = sameMarketReturnVolatilities(tradingDays)
  const closeReturnScore = scoreCloseReturnVolatility(
    targetReturnVolatility,
    peerReturnVolatilities
  )

  const targetRange = average(
    tradingDays.map((day) => intradayRangePercent(day.target))
  )
  const peerRanges = sameMarketIntradayRanges(tradingDays)
  const intradayRangeScore = scoreIntradayRange(targetRange, peerRanges)

  const swingDayCount = tradingDays.filter(
    (day) =>
      Math.abs(day.target.dailyReturnPct) >=
      POLICY.priceVolatility.swingDays.dailyReturnAtLeast
  ).length
  const swingDayScore = scoreSwingDays(swingDayCount)
  const score = closeReturnScore + intradayRangeScore + swingDayScore

  return {
    type: "price-volatility",
    label: "가격 급등락",
    score,
    maxScore: POLICY.priceVolatility.maxScore,
    description:
      score === 0
        ? "최근 가격 움직임은 같은 시장 안에서 튀는 편이 아닙니다."
        : `종가 변동성, 장중 고저폭, 급등락일 ${swingDayCount}회를 반영했습니다.`,
  }
}

function scoreLiquidity(
  stock: Stock,
  tradingDays: TradingWindow
): {
  readonly signal: JobjuSignal
  readonly tradeValueTopPercent: number
} {
  const latest = tradingDays[0]
  const peerTradeValues = latest.sameMarket.map(
    (stockRow) => stockRow.tradeValue
  )
  const thinTradeValueScore = scoreTradeValueThinness(
    latest.target.tradeValue,
    peerTradeValues
  )

  const usualVolume = median(tradingDays.map((day) => day.target.volume))
  const volumeMultiple = latest.target.volume / usualVolume
  const targetTurnover = turnoverPercent(latest.target)
  const peerTurnovers = latest.sameMarket
    .filter((stockRow) => stockRow.listedShares > 0)
    .map(turnoverPercent)
  const volumeJumpScore = scoreVolumeJump({
    targetTurnover,
    peerTurnovers,
    volumeMultiple,
  })
  const lowLiquidityScore = stock.isLowLiquidity
    ? POLICY.liquidity.lowLiquidityFlagScore
    : 0
  const score = thinTradeValueScore + volumeJumpScore + lowLiquidityScore

  return {
    tradeValueTopPercent: topPercent(latest.target.tradeValue, peerTradeValues),
    signal: {
      type: "liquidity",
      label: "거래 얇음",
      score,
      maxScore: POLICY.liquidity.maxScore,
      description:
        score === 0
          ? "거래대금과 회전율이 위험 신호로 보일 정도는 아닙니다."
          : "거래대금 위치, 거래량 급증, 저유동성 플래그를 함께 반영했습니다.",
    },
  }
}

function scoreMarketSize(
  stock: Stock,
  tradingDays: TradingWindow
): {
  readonly signal: JobjuSignal
  readonly marketCapTopPercent: number
} {
  const latest = tradingDays[0]
  const targetMarketCap = targetMarketCapFor(latest.target, stock)
  const peerMarketCaps = latest.sameMarket
    .map((stockRow) => stockRow.marketCap)
    .filter((marketCap) => marketCap > 0)
  const score = scoreMarketCapSmallness(targetMarketCap, peerMarketCaps)

  return {
    marketCapTopPercent: topPercent(targetMarketCap, peerMarketCaps),
    signal: {
      type: "market-size",
      label: "소형성",
      score,
      maxScore: POLICY.marketSize.maxScore,
      description:
        score === 0
          ? "시가총액 위치만 보면 소형주 위험 신호가 크지 않습니다."
          : "같은 시장 종목들과 비교한 시가총액 하위권 여부를 반영했습니다.",
    },
  }
}

function scoreMarketSensitivity(input: ScoringInput): JobjuSignal {
  const indexName = REPRESENTATIVE_INDEX_BY_MARKET[input.stock.marketName]
  const marketReturns = input.tradingDays
    .map((day) => day.indexes.find((index) => index.indexName === indexName))
    .filter((index) => index !== undefined)
    .map((index) => index.changeRate)
  const targetVolatility = standardDeviation(
    input.tradingDays.map((day) => day.target.dailyReturnPct)
  )
  const marketVolatility = standardDeviation(marketReturns)
  const ratio = targetVolatility / marketVolatility
  const score = scoreMarketSensitivityRatio(ratio)

  return {
    type: "market-sensitivity",
    label: "시장 대비 과민 반응",
    score,
    maxScore: POLICY.marketSensitivity.maxScore,
    description:
      score === 0
        ? "시장지수 변동성과 비교했을 때 종목만 과하게 튄 흐름은 약합니다."
        : `대표지수 변동성 대비 약 ${ratio.toFixed(1)}배 움직인 구간을 반영했습니다.`,
  }
}

function scoreStatusFlags(stock: Stock): {
  readonly signal: JobjuSignal
  readonly hasProblem: boolean
} {
  let score = 0

  if (stock.isUnderAdministration) {
    score += POLICY.statusFlags.underAdministrationScore
  }

  if (stock.isTradingHalted) {
    score += POLICY.statusFlags.tradingHaltedScore
  }

  if (stock.isLowLiquidity) {
    score += POLICY.statusFlags.lowLiquidityScore
  }

  score += scoreMarketWarning(stock.warningLevel)
  score = Math.min(score, POLICY.statusFlags.maxScore)

  return {
    hasProblem: score > 0,
    signal: {
      type: "status-flags",
      label: "종목 상태",
      score,
      maxScore: POLICY.statusFlags.maxScore,
      description:
        score === 0
          ? "관리종목, 거래정지, 저유동성, 시장경고 플래그가 없습니다."
          : "관리종목, 거래정지, 저유동성, 시장경고 플래그를 반영했습니다.",
    },
  }
}

function scoreFinancialDisclosure(
  accounts: readonly FinancialAccount[],
  disclosures: readonly MarketDisclosure[]
): {
  readonly signal: JobjuSignal
  readonly hasProblem: boolean
} {
  let score = 0
  score += scoreDeficitYears(accounts)
  score += scoreCapitalImpairment(accounts)
  score += scoreDebtRatio(accounts)
  score += scoreDisclosureRisk(disclosures)
  score = Math.min(score, POLICY.financialDisclosure.maxScore)

  return {
    hasProblem: score > 0,
    signal: {
      type: "financial-disclosure",
      label: "재무/공시",
      score,
      maxScore: POLICY.financialDisclosure.maxScore,
      description:
        score === 0
          ? "최근 재무와 공시 목록에서 강한 불안 신호가 잡히지 않았습니다."
          : "적자, 자본잠식 후보, 부채비율, 정정/철회/주요사항 공시를 반영했습니다.",
    },
  }
}

function scoreCloseReturnVolatility(
  targetVolatility: number,
  peerVolatilities: readonly number[]
): number {
  const targetTopPercent = topPercent(targetVolatility, peerVolatilities)

  for (const tier of POLICY.priceVolatility.closeReturnVolatility.tiers) {
    if (targetTopPercent <= tier.topPercent) {
      return tier.score
    }
  }

  return 0
}

function scoreIntradayRange(
  targetRange: number,
  peerRanges: readonly number[]
): number {
  const targetTopPercent = topPercent(targetRange, peerRanges)

  for (const tier of POLICY.priceVolatility.intradayRange.tiers) {
    if (targetTopPercent <= tier.topPercent) {
      return tier.score
    }
  }

  return 0
}

function scoreSwingDays(swingDayCount: number): number {
  for (const tier of POLICY.priceVolatility.swingDays.tiers) {
    if (swingDayCount >= tier.daysAtLeast) {
      return tier.score
    }
  }

  return 0
}

function scoreTradeValueThinness(
  targetTradeValue: number,
  peerTradeValues: readonly number[]
): number {
  const targetBottomPercent = bottomPercent(targetTradeValue, peerTradeValues)

  for (const tier of POLICY.liquidity.thinTradeValue.tiers) {
    if (targetBottomPercent <= tier.bottomPercent) {
      return tier.score
    }
  }

  return 0
}

function scoreVolumeJump(input: {
  readonly targetTurnover: number
  readonly peerTurnovers: readonly number[]
  readonly volumeMultiple: number
}): number {
  const turnoverTopPercent = topPercent(
    input.targetTurnover,
    input.peerTurnovers
  )

  if (turnoverTopPercent <= POLICY.liquidity.volumeJump.turnoverTopPercent) {
    return POLICY.liquidity.volumeJump.turnoverScore
  }

  if (
    input.volumeMultiple >= POLICY.liquidity.volumeJump.volumeMultipleStrong
  ) {
    return POLICY.liquidity.volumeJump.strongMultipleScore
  }

  if (input.volumeMultiple >= POLICY.liquidity.volumeJump.volumeMultipleWeak) {
    return POLICY.liquidity.volumeJump.weakMultipleScore
  }

  return 0
}

function scoreMarketCapSmallness(
  targetMarketCap: number,
  peerMarketCaps: readonly number[]
): number {
  const targetBottomPercent = bottomPercent(targetMarketCap, peerMarketCaps)

  for (const tier of POLICY.marketSize.smallMarketCap.tiers) {
    if (targetBottomPercent <= tier.bottomPercent) {
      return tier.score
    }
  }

  return 0
}

function scoreMarketSensitivityRatio(ratio: number): number {
  for (const tier of POLICY.marketSensitivity.tiers) {
    if (ratio >= tier.ratioAtLeast) {
      return tier.score
    }
  }

  return 0
}

function scoreMarketWarning(warningLevel: string | null | undefined): number {
  if (!warningLevel || warningLevel === "00") {
    return 0
  }

  if (warningLevel === "03") {
    return POLICY.statusFlags.marketWarning.investmentRiskScore
  }

  if (warningLevel === "02") {
    return POLICY.statusFlags.marketWarning.investmentWarningScore
  }

  return POLICY.statusFlags.marketWarning.investmentCautionScore
}

function scoreDeficitYears(accounts: readonly FinancialAccount[]): number {
  const deficitYearCount = latestBusinessYears(accounts).filter(
    (businessYear) => hasDeficit(accounts, businessYear)
  ).length

  if (deficitYearCount >= 2) {
    return POLICY.financialDisclosure.deficit.twoYearsScore
  }

  if (deficitYearCount === 1) {
    return POLICY.financialDisclosure.deficit.oneYearScore
  }

  return 0
}

function scoreCapitalImpairment(accounts: readonly FinancialAccount[]): number {
  const latestAccounts = latestAccountsByBusinessYear(accounts)
  const equity = accountAmount(latestAccounts, "자본총계")
  const capital = accountAmount(latestAccounts, "자본금")

  if (equity < 0) {
    return POLICY.financialDisclosure.capitalImpairment.negativeEquityScore
  }

  if (capital > 0 && equity < capital) {
    return POLICY.financialDisclosure.capitalImpairment.equityBelowCapitalScore
  }

  return 0
}

function scoreDebtRatio(accounts: readonly FinancialAccount[]): number {
  const latestAccounts = latestAccountsByBusinessYear(accounts)
  const liability = accountAmount(latestAccounts, "부채총계")
  const equity = accountAmount(latestAccounts, "자본총계")

  if (liability <= 0 || equity <= 0) {
    return 0
  }

  const debtRatio = (liability / equity) * 100

  if (debtRatio >= POLICY.financialDisclosure.debtRatio.veryHighPercent) {
    return POLICY.financialDisclosure.debtRatio.veryHighScore
  }

  if (debtRatio >= POLICY.financialDisclosure.debtRatio.highPercent) {
    return POLICY.financialDisclosure.debtRatio.highScore
  }

  return 0
}

function scoreDisclosureRisk(disclosures: readonly MarketDisclosure[]): number {
  const count = disclosures.filter((disclosure) => {
    const text = `${disclosure.reportName} ${disclosure.remark}`

    return POLICY.financialDisclosure.disclosure.keywords.some((keyword) =>
      text.includes(keyword)
    )
  }).length

  if (
    count >= POLICY.financialDisclosure.disclosure.countAtLeastForStrongScore
  ) {
    return POLICY.financialDisclosure.disclosure.strongScore
  }

  if (count >= POLICY.financialDisclosure.disclosure.countAtLeastForWeakScore) {
    return POLICY.financialDisclosure.disclosure.weakScore
  }

  return 0
}

function applyLargeStockCap(input: {
  readonly rawScore: number
  readonly marketCapTopPercent: number
  readonly tradeValueTopPercent: number
  readonly hasStatusProblem: boolean
  readonly hasFinancialProblem: boolean
}): number {
  if (
    input.marketCapTopPercent <= 10 &&
    input.tradeValueTopPercent <= 10 &&
    !input.hasStatusProblem &&
    !input.hasFinancialProblem
  ) {
    return Math.min(
      input.rawScore,
      POLICY.largeStockCap.topTenMarketCapAndTradeValue
    )
  }

  if (
    input.marketCapTopPercent <= 20 &&
    input.tradeValueTopPercent <= 20 &&
    !input.hasStatusProblem
  ) {
    return Math.min(
      input.rawScore,
      POLICY.largeStockCap.topTwentyMarketCapAndTradeValue
    )
  }

  return Math.min(input.rawScore, 100)
}

function gradeFor(score: number): JobjuGrade {
  for (const grade of POLICY.grades) {
    if (score >= grade.minScore) {
      return grade.grade
    }
  }

  return "normal"
}

function gradePolicy(grade: JobjuGrade): {
  readonly label: string
  readonly summary: string
} {
  const policy = POLICY.grades.find((item) => item.grade === grade)

  if (policy) {
    return policy
  }

  return POLICY.grades[POLICY.grades.length - 1]
}

function sameMarketReturnVolatilities(
  tradingDays: TradingWindow
): readonly number[] {
  const returnsByStock = new Map<string, number[]>()

  for (const day of tradingDays) {
    for (const stockRow of day.sameMarket) {
      returnsByStock.set(stockRow.stockCode, [
        ...(returnsByStock.get(stockRow.stockCode) ?? []),
        stockRow.dailyReturnPct,
      ])
    }
  }

  return [...returnsByStock.values()]
    .filter((returns) => returns.length >= 5)
    .map(standardDeviation)
}

function sameMarketIntradayRanges(
  tradingDays: TradingWindow
): readonly number[] {
  const rangesByStock = new Map<string, number[]>()

  for (const day of tradingDays) {
    for (const stockRow of day.sameMarket) {
      rangesByStock.set(stockRow.stockCode, [
        ...(rangesByStock.get(stockRow.stockCode) ?? []),
        intradayRangePercent(stockRow),
      ])
    }
  }

  return [...rangesByStock.values()]
    .filter((ranges) => ranges.length >= 5)
    .map(average)
}

function topPercent(value: number, peerValues: readonly number[]): number {
  const peerCount = peerValues.length

  if (peerCount === 0) {
    return 100
  }

  const strongerPeerCount = peerValues.filter(
    (peerValue) => peerValue > value
  ).length

  return (strongerPeerCount / peerCount) * 100
}

function bottomPercent(value: number, peerValues: readonly number[]): number {
  const peerCount = peerValues.length

  if (peerCount === 0) {
    return 100
  }

  const weakerPeerCount = peerValues.filter(
    (peerValue) => peerValue < value
  ).length

  return (weakerPeerCount / peerCount) * 100
}

function targetMarketCapFor(row: DailyStockPrice, stock: Stock): number {
  if (row.marketCap > 0) {
    return row.marketCap
  }

  return stock.marketCap ?? 0
}

const REPRESENTATIVE_INDEX_BY_MARKET: Record<SupportedMarket, string> = {
  KOSPI: POLICY.marketSensitivity.kospiIndexName,
  KOSDAQ: POLICY.marketSensitivity.kosdaqIndexName,
}

function turnoverPercent(row: DailyStockPrice): number {
  if (row.listedShares <= 0) {
    return 0
  }

  return (row.volume / row.listedShares) * 100
}

function intradayRangePercent(row: DailyStockPrice): number {
  if (row.closePrice <= 0) {
    return 0
  }

  return ((row.highPrice - row.lowPrice) / row.closePrice) * 100
}

function latestBusinessYears(
  accounts: readonly FinancialAccount[]
): readonly string[] {
  return [...new Set(accounts.map((account) => account.businessYear))]
    .sort((left, right) => right.localeCompare(left))
    .slice(0, 2)
}

function latestAccountsByBusinessYear(
  accounts: readonly FinancialAccount[]
): readonly FinancialAccount[] {
  const latestYear = latestBusinessYears(accounts)[0]

  if (!latestYear) {
    return []
  }

  return accounts.filter((account) => account.businessYear === latestYear)
}

function hasDeficit(
  accounts: readonly FinancialAccount[],
  businessYear: string
): boolean {
  const yearlyAccounts = accounts.filter(
    (account) => account.businessYear === businessYear
  )

  return (
    accountAmount(yearlyAccounts, "영업이익") < 0 ||
    accountAmount(yearlyAccounts, "당기순이익") < 0
  )
}

function accountAmount(
  accounts: readonly FinancialAccount[],
  keyword: string
): number {
  return (
    accounts.find((account) => account.accountName.includes(keyword))
      ?.currentAmount ?? 0
  )
}

function standardDeviation(values: readonly number[]): number {
  const valueAverage = average(values)
  const variance = average(
    values.map((value) => (value - valueAverage) * (value - valueAverage))
  )

  return Math.sqrt(variance)
}

function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((total, value) => total + value, 0) / values.length
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 1) {
    return sorted[middle] ?? 0
  }

  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
}
