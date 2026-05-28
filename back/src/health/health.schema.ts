import { z } from "zod"

export const healthCheckSchema = z.object({
  status: z.literal("ok").meta({ example: "ok" }),
})

export type HealthCheck = z.infer<typeof healthCheckSchema>
