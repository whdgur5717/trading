import { z } from "zod"

export const apiSuccessSchema = z.object({
  success: z.literal(true).meta({ example: true }),
  data: z.unknown(),
  meta: z.record(z.string(), z.unknown()).optional(),
})

export const apiErrorDetailSchema = z.object({
  status: z.number().int().meta({ example: 400 }),
  type: z.string().meta({ example: "common.invalid_request" }),
  message: z.string().meta({ example: "Validation failed" }),
  data: z.unknown(),
})

export const apiErrorSchema = z.object({
  success: z.literal(false).meta({ example: false }),
  error: apiErrorDetailSchema,
})

export type ApiErrorDetail = z.infer<typeof apiErrorDetailSchema>
export type ApiFailure = z.infer<typeof apiErrorSchema>
export type ApiSuccess = z.infer<typeof apiSuccessSchema>
