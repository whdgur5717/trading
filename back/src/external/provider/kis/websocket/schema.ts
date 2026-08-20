import { z } from "zod"

const frameSchema = z.strictObject({
  encrypted: z.boolean(),
  trId: z.string().min(1),
  count: z.number().int().nonnegative(),
  payload: z.string(),
})

export const kisWebSocketFrameSchema = z
  .string()
  .transform((raw) => {
    const [encryption, trId, rawCount, ...payload] = raw.split("|")

    if (
      (encryption !== "0" && encryption !== "1") ||
      !trId ||
      !rawCount ||
      !/^\d+$/.test(rawCount) ||
      payload.length === 0
    ) {
      return null
    }

    return {
      encrypted: encryption === "1",
      trId,
      count: Number(rawCount),
      payload: payload.join("|"),
    }
  })
  .pipe(frameSchema.nullable())

export type KisWebSocketFrame = z.output<typeof frameSchema>
