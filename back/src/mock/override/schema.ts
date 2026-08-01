import { z } from "zod"

export const overrideSchema = z.object({
  operationId: z.string().min(1),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  path: z.string().min(1),
  responseId: z.string().min(1),
  enabled: z.boolean(),
  status: z.number().int().min(100).max(599),
  contentType: z.enum(["application/json", "text/event-stream"]),
  body: z.unknown(),
  delayMs: z.number().int().nonnegative().optional(),
})

export type Override = z.infer<typeof overrideSchema>

export const sseEventSchema = z.object({
  event: z
    .string()
    .min(1)
    .regex(/^[^\r\n]+$/),
  data: z.unknown(),
  id: z.string().min(1).optional(),
  retry: z.number().int().positive().optional(),
  delayMs: z.number().int().nonnegative().optional(),
  repeatMs: z.number().int().positive().optional(),
  close: z.boolean().optional(),
})

export const sseScenarioSchema = z.object({
  events: z.array(sseEventSchema).min(1),
})

export type SseEvent = z.infer<typeof sseEventSchema>
