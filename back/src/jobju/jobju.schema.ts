import { z } from "zod"
import { stockSymbolSchema } from "../market/port/data"
import { stockSchema } from "../stocks/stock.schema"

export const jobjuQuerySchema = z.object({
  symbol: stockSymbolSchema,
})

export const jobjuGradeSchema = z.enum([
  "normal",
  "notice",
  "suspect",
  "high",
  "danger",
])

export const jobjuSignalTypeSchema = z.enum([
  "price-volatility",
  "liquidity",
  "market-size",
  "market-sensitivity",
  "status-flags",
  "financial-disclosure",
])

export const jobjuSignalSchema = z.object({
  type: jobjuSignalTypeSchema,
  label: z.string().meta({ example: "가격 급등락" }),
  score: z.number().int().min(0).meta({ example: 18 }),
  maxScore: z.number().int().positive().meta({ example: 25 }),
  description: z.string().meta({
    example: "최근 20거래일 가격 움직임과 장중 고저폭을 반영했습니다.",
  }),
})

export const jobjuScoreSchema = z.object({
  stock: stockSchema.pick({
    symbol: true,
    name: true,
    marketName: true,
  }),
  asOfDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .meta({
      example: "2026-06-18",
    }),
  sampleDays: z.number().int().positive().meta({ example: 20 }),
  score: z.number().int().min(0).max(100).meta({ example: 87 }),
  grade: jobjuGradeSchema.meta({ example: "danger" }),
  label: z.string().meta({ example: "인간지표급 잡주" }),
  summary: z.string().meta({
    example: "여러 위험 신호가 동시에 터진 상태입니다.",
  }),
  signals: z.array(jobjuSignalSchema),
})

export type JobjuQuery = z.output<typeof jobjuQuerySchema>
export type JobjuGrade = z.output<typeof jobjuGradeSchema>
export type JobjuSignalType = z.output<typeof jobjuSignalTypeSchema>
export type JobjuSignal = z.output<typeof jobjuSignalSchema>
export type JobjuScore = z.output<typeof jobjuScoreSchema>
