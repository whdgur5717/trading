import { z } from "zod"

const KST_TIME_ZONE = "Asia/Seoul"

export const pastOrTodayIsoDateSchema = createPastOrTodayIsoDateSchema()

export function createPastOrTodayIsoDateSchema(
  now: () => Date = () => new Date()
) {
  return z.iso.date().refine((value) => value <= getKstDateKey(now()), {
    message: "date must not be in the future",
  })
}

function getKstDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}
