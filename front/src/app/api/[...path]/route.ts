import type { NextRequest } from "next/server"

import { issueToken } from "@/server/token"

type RouteContext = {
  params: Promise<{
    path: string[]
  }>
}

const backendBaseUrl = process.env.API_BASE_URL

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  const backendUrl = new URL(
    `/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`,
    backendBaseUrl
  )
  const headers = new Headers(request.headers)

  headers.delete("host")
  headers.delete("connection")
  headers.delete("content-length")
  headers.delete("authorization")

  const token = await issueToken()

  if (token) {
    headers.set("authorization", `Bearer ${token}`)
  }

  const response = await fetch(backendUrl, {
    method: request.method,
    headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
    cache: "no-store",
  })
  const responseHeaders = new Headers(response.headers)

  responseHeaders.delete("content-encoding")
  responseHeaders.delete("content-length")

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
export const HEAD = proxy
export const OPTIONS = proxy
