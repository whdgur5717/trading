import { GoogleAuth } from "google-auth-library"

export async function issueToken(): Promise<string | null> {
  if (process.env.NODE_ENV !== "production") {
    return null
  }

  const apiBaseUrl = process.env.API_BASE_URL

  if (!apiBaseUrl) {
    throw new Error("API_BASE_URL is required")
  }

  const auth = new GoogleAuth()
  const client = await auth.getIdTokenClient(apiBaseUrl)
  const headers = await client.getRequestHeaders()
  const authorization = headers.get("authorization")

  return authorization?.replace(/^Bearer\s+/, "") ?? null
}
