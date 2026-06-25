export const POLICY = {
  tradingDays: 20,
  supportedMarkets: ["KOSPI", "KOSDAQ"],
  unsupportedProductTypes: ["PREFERRED", "ETF", "ETN", "REIT", "SPAC"],
  priceVolatility: {
    maxScore: 25,
    closeReturnVolatility: {
      maxScore: 10,
      tiers: [
        { topPercent: 5, score: 10 },
        { topPercent: 10, score: 7 },
        { topPercent: 30, score: 4 },
      ],
    },
    intradayRange: {
      maxScore: 7,
      tiers: [
        { topPercent: 5, score: 7 },
        { topPercent: 10, score: 5 },
        { topPercent: 30, score: 3 },
      ],
    },
    swingDays: {
      maxScore: 8,
      dailyReturnAtLeast: 10,
      tiers: [
        { daysAtLeast: 3, score: 8 },
        { daysAtLeast: 2, score: 5 },
        { daysAtLeast: 1, score: 3 },
      ],
    },
  },
  liquidity: {
    maxScore: 20,
    thinTradeValue: {
      maxScore: 8,
      tiers: [
        { bottomPercent: 5, score: 8 },
        { bottomPercent: 10, score: 6 },
        { bottomPercent: 30, score: 3 },
      ],
    },
    volumeJump: {
      maxScore: 7,
      turnoverTopPercent: 10,
      volumeMultipleStrong: 5,
      volumeMultipleWeak: 3,
      turnoverScore: 7,
      strongMultipleScore: 5,
      weakMultipleScore: 3,
    },
    lowLiquidityFlagScore: 5,
  },
  marketSize: {
    maxScore: 15,
    smallMarketCap: {
      tiers: [
        { bottomPercent: 5, score: 15 },
        { bottomPercent: 10, score: 10 },
        { bottomPercent: 20, score: 5 },
      ],
    },
  },
  marketSensitivity: {
    maxScore: 10,
    kospiIndexName: "코스피",
    kosdaqIndexName: "코스닥",
    tiers: [
      { ratioAtLeast: 3, score: 10 },
      { ratioAtLeast: 2, score: 7 },
      { ratioAtLeast: 1.5, score: 3 },
    ],
  },
  statusFlags: {
    maxScore: 15,
    underAdministrationScore: 8,
    tradingHaltedScore: 8,
    lowLiquidityScore: 5,
    marketWarning: {
      investmentRiskScore: 7,
      investmentWarningScore: 6,
      investmentCautionScore: 4,
    },
  },
  financialDisclosure: {
    maxScore: 15,
    deficit: {
      oneYearScore: 3,
      twoYearsScore: 5,
    },
    capitalImpairment: {
      equityBelowCapitalScore: 3,
      negativeEquityScore: 5,
    },
    debtRatio: {
      highPercent: 300,
      veryHighPercent: 500,
      highScore: 2,
      veryHighScore: 3,
    },
    disclosure: {
      keywords: ["정정", "철회", "주요사항"],
      countAtLeastForWeakScore: 2,
      countAtLeastForStrongScore: 5,
      weakScore: 3,
      strongScore: 5,
    },
  },
  largeStockCap: {
    topTenMarketCapAndTradeValue: 39,
    topTwentyMarketCapAndTradeValue: 49,
  },
  grades: [
    {
      minScore: 85,
      grade: "danger",
      label: "인간지표급 잡주",
      summary: "여러 위험 신호가 동시에 터진 상태입니다.",
    },
    {
      minScore: 70,
      grade: "high",
      label: "잡주력 높음",
      summary: "가격, 거래, 상태 신호가 뚜렷하게 겹칩니다.",
    },
    {
      minScore: 50,
      grade: "suspect",
      label: "잡주 의심",
      summary: "가격, 거래, 규모 중 여러 신호가 겹칩니다.",
    },
    {
      minScore: 25,
      grade: "notice",
      label: "약간 잡내",
      summary: "변동성이나 거래 신호가 조금 있습니다.",
    },
    {
      minScore: 0,
      grade: "normal",
      label: "정상권",
      summary: "현재 기준으로 잡주력은 낮은 편입니다.",
    },
  ],
} as const

export type SupportedMarket = (typeof POLICY.supportedMarkets)[number]
