import { z } from "zod"

const textSchema = z.string().trim().min(1)

const idSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const amountSchema = z.number().int().nonnegative()
const positiveAmountSchema = z.number().int().positive()

export const DirectionSchema = z.enum(["gain", "loss", "flat"])

export const CategorySchema = z.enum([
  "cafe",
  "culture",
  "device",
  "food",
  "living",
  "luxury",
  "public",
  "shopping",
  "subscription",
  "transport",
  "travel",
  "utility",
  "wage",
])

export const TierSchema = z.enum([
  "budget",
  "everyday",
  "mid",
  "premium",
  "luxury",
])

export const DirectionsSchema = z
  .array(DirectionSchema)
  .min(1)
  .superRefine((directions, context) => {
    const seenDirections = new Set<string>()

    directions.forEach((direction, index) => {
      if (seenDirections.has(direction)) {
        context.addIssue({
          code: "custom",
          message: "direction must be unique",
          path: [index],
        })
      }

      seenDirections.add(direction)
    })
  })

export const RangeSchema = z
  .strictObject({
    max: amountSchema.optional(),
    min: amountSchema,
  })
  .superRefine(({ max, min }, context) => {
    if (max !== undefined && max <= min) {
      context.addIssue({
        code: "custom",
        message: "max must be greater than min",
        path: ["max"],
      })
    }
  })

export const RoundingSchema = z.enum(["floor", "round", "ceil"])

export const PrecisionSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
])

const ReferenceBaseSchema = z.strictObject({
  category: CategorySchema,
  directions: DirectionsSchema,
  enabled: z.boolean().default(true),
  id: idSchema,
  range: RangeSchema,
  rank: z.number().int().default(0),
  tier: TierSchema,
})

const QuantifiedReferenceSchema = ReferenceBaseSchema.extend({
  amount: positiveAmountSchema,
  name: textSchema,
  precision: PrecisionSchema.default(0),
  rounding: RoundingSchema.default("floor"),
})

export const CountReferenceSchema = QuantifiedReferenceSchema.extend({
  countUnit: textSchema,
  kind: z.literal("count"),
})

export const RateReferenceSchema = QuantifiedReferenceSchema.extend({
  kind: z.literal("rate"),
  precision: PrecisionSchema.default(1),
  rounding: RoundingSchema.default("round"),
  quantityUnit: textSchema,
})

export const GoalReferenceSchema = ReferenceBaseSchema.extend({
  amount: positiveAmountSchema,
  kind: z.literal("goal"),
  name: textSchema,
  precision: PrecisionSchema.default(1),
})

export const LevelReferenceSchema = ReferenceBaseSchema.extend({
  kind: z.literal("level"),
  levels: z
    .array(
      z.strictObject({
        min: amountSchema,
        name: textSchema,
        tone: z.enum(["low", "medium", "high", "extreme"]).optional(),
      })
    )
    .min(1)
    .superRefine((levels, context) => {
      const seenMins = new Set<number>()

      levels.forEach(({ min }, index) => {
        if (seenMins.has(min)) {
          context.addIssue({
            code: "custom",
            message: "level min must be unique",
            path: [index, "min"],
          })
        }

        seenMins.add(min)

        if (index > 0 && min <= levels[index - 1].min) {
          context.addIssue({
            code: "custom",
            message: "level min must be ascending",
            path: [index, "min"],
          })
        }
      })
    }),
})

export const ReferenceSchema = z.discriminatedUnion("kind", [
  CountReferenceSchema,
  RateReferenceSchema,
  GoalReferenceSchema,
  LevelReferenceSchema,
])

export const SelectionSchema = z.strictObject({
  distinctKinds: z.boolean().default(true),
  maxItems: z.number().int().positive().optional(),
})

export const ReferencesSchema = z
  .strictObject({
    references: z.array(ReferenceSchema).min(1),
    selection: SelectionSchema.default({
      distinctKinds: true,
    }),
    version: z.number().int().positive().default(1),
  })
  .superRefine(({ references }, context) => {
    const seenIds = new Set<string>()

    references.forEach(({ id }, index) => {
      if (seenIds.has(id)) {
        context.addIssue({
          code: "custom",
          message: "reference id must be unique",
          path: ["references", index, "id"],
        })
      }

      seenIds.add(id)
    })
  })

export type Direction = z.output<typeof DirectionSchema>
export type Reference = z.output<typeof ReferenceSchema>
