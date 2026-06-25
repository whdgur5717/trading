import { z } from "zod"
import { API_ERRORS } from "../error/error-catalog"

export const apiSuccessSchema = z.object({
  success: z.literal(true).meta({ example: true }),
  data: z.unknown(),
  meta: z.record(z.string(), z.unknown()).optional(),
})

export const apiErrorDetailSchema = z.object({
  status: z.number().int().meta({ example: 400 }),
  code: z.enum(Object.keys(API_ERRORS)).meta({ example: "invalid-request" }),
  message: z.string().meta({ example: "Validation failed" }),
  details: z.unknown().optional(),
})

export const apiErrorSchema = z.object({
  success: z.literal(false).meta({ example: false }),
  error: apiErrorDetailSchema,
})

export type ApiErrorDetail = z.infer<typeof apiErrorDetailSchema>
export type ApiFailure = z.infer<typeof apiErrorSchema>
export type ApiSuccess<T> = z.infer<typeof apiSuccessSchema> & {
  data: T
}
