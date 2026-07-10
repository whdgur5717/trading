import ky from "ky"
import type { ZodError } from "zod"

export const apiBaseUrl =
  typeof window === "undefined" ? `${process.env.APP_ORIGIN}/api` : "/api"

type ApiSchemaErrorParams = {
  status: number
  schemaName: string
  body: unknown
  zodError: ZodError
}

export class ApiSchemaError extends Error {
  readonly status: number
  readonly schemaName: string
  readonly body: unknown
  readonly zodError: ZodError

  constructor({ status, schemaName, body, zodError }: ApiSchemaErrorParams) {
    super(`API response schema mismatch: ${schemaName}`)
    this.name = "ApiSchemaError"
    this.status = status
    this.schemaName = schemaName
    this.body = body
    this.zodError = zodError
  }
}

export class ApiUnexpectedStatusError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown
  ) {
    super(`Unexpected response status: ${status}`)
    this.name = "ApiUnexpectedStatusError"
  }
}

export const api = ky.create({
  prefix: apiBaseUrl,
  throwHttpErrors: false,
})
