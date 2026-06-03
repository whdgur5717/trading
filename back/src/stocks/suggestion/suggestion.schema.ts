import { z } from "zod"
import { stockSchema } from "../stock.schema"

export const DEFAULT_SUGGESTION_LIMIT = 10
export const MAX_SUGGESTION_LIMIT = 50

export const suggestionQuerySchema = z.object({
  q: z.string().trim().min(1).meta({ example: "삼ㅈ" }),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_SUGGESTION_LIMIT)
    .default(DEFAULT_SUGGESTION_LIMIT)
    .meta({ example: DEFAULT_SUGGESTION_LIMIT }),
})

export const suggestionSchema = z.object({
  items: z.array(stockSchema),
  hasMore: z.boolean().meta({ example: true }),
})

export type SuggestionQuery = z.infer<typeof suggestionQuerySchema>
export type Suggestion = z.infer<typeof suggestionSchema>
