import { z } from "zod"

const envSchema = z.object({
  APP_KEY: z.string().min(1),
  APP_SECRET: z.string().min(1),
  HOST: z.string().min(1),
  PORT: z.coerce.number().int().positive(),
  KIS_REST_BASE_URL: z.url(),
  KIS_WS_URL: z.string().min(1),
  KIS_REALTIME_TR_ID: z.string().min(1),
  PUBLIC_DATA_SERVICE_KEY: z.string().min(1),
  DART_API_KEY: z.string().min(1),
})

export type AppEnv = z.infer<typeof envSchema>

export function validateEnv(config: Record<string, unknown>): AppEnv {
  return envSchema.parse(config)
}
