import { getCloudflareContext } from "@opennextjs/cloudflare"
import { z } from "zod"

const CLIENT_ID_HEADER = "CF-Access-Client-Id"
const CLIENT_SECRET_HEADER = "CF-Access-Client-Secret"

const cloudflareAccessEnvSchema = z.object({
  CF_ACCESS_CLIENT_ID: z.string(),
  CF_ACCESS_CLIENT_SECRET: z.string(),
})

export function deleteCloudflareAccessHeaders(headers: Headers): void {
  headers.delete(CLIENT_ID_HEADER)
  headers.delete(CLIENT_SECRET_HEADER)
}

export function applyCloudflareAccessHeaders(headers: Headers): void {
  const { env } = getCloudflareContext()
  const { CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET } =
    cloudflareAccessEnvSchema.parse(env)

  headers.set(CLIENT_ID_HEADER, CF_ACCESS_CLIENT_ID)
  headers.set(CLIENT_SECRET_HEADER, CF_ACCESS_CLIENT_SECRET)
}
