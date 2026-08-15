import { z } from "zod"

const envSchema = z.object({
  APP_KEY: z.string().min(1),
  APP_SECRET: z.string().min(1),
  HOST: z.string().min(1),
  PORT: z.coerce.number().int().positive(),
  KIS_REST_BASE_URL: z
    .url()
    .default("https://openapi.koreainvestment.com:9443"),
  KIS_WS_URL: z.url().default("ws://ops.koreainvestment.com:21000/tryitout"),
  FSC_REST_BASE_URL: z.url().default("https://apis.data.go.kr"),
  OPENDART_REST_BASE_URL: z.url().default("https://opendart.fss.or.kr"),
  KIS_REALTIME_TR_ID: z.string().min(1),
  KIS_REST_QUEUE_CONCURRENCY: z.coerce.number().int().positive().default(3),
  KIS_REST_QUEUE_INTERVAL_CAP: z.coerce.number().int().positive().default(3),
  KIS_REST_QUEUE_INTERVAL_MS: z.coerce.number().int().positive().default(300),
  PUBLIC_DATA_SERVICE_KEY: z.string().min(1),
  DART_API_KEY: z.string().min(1),
})

export type AppEnv = z.infer<typeof envSchema>

export function validateEnv(config: Record<string, unknown>): AppEnv {
  return envSchema.parse(config)
}
