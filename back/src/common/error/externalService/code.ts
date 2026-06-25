import { z } from "zod"

export const EXTERNAL_SERVICE_CODE = {
  unavailable: "unavailable",
  "auth-unavailable": "auth-unavailable",
  timeout: "timeout",
  "invalid-response": "invalid-response",
  "not-found": "not-found",
} as const

export const externalServiceCodeSchema = z.enum(EXTERNAL_SERVICE_CODE)

export type ExternalServiceCode = z.infer<typeof externalServiceCodeSchema>
