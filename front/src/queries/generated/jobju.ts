import { ApiSchemaError, ApiUnexpectedStatusError, api } from "../api"
import { ResultAsync, err, ok, type Result } from "neverthrow"
import {
  JobjuControllerScoreResponse200Schema,
  type JobjuControllerScoreResponse200,
  JobjuControllerScoreResponse400Schema,
  type JobjuControllerScoreResponse400,
  JobjuControllerScoreResponse404Schema,
  type JobjuControllerScoreResponse404,
  JobjuControllerScoreResponse422Schema,
  type JobjuControllerScoreResponse422,
} from "./schemas"

export type JobjuControllerScoreParams = {
  symbol: string
}

export type JobjuControllerScoreSuccess = {
  status: 200
  body: JobjuControllerScoreResponse200
}

export type JobjuControllerScoreFailure =
  | { status: 400; body: JobjuControllerScoreResponse400 }
  | { status: 404; body: JobjuControllerScoreResponse404 }
  | { status: 422; body: JobjuControllerScoreResponse422 }

/**
 * @example
 * ```ts
 * await JOBJU_CONTROLLER_SCORE({
 *   symbol: "005930"
 * })
 * ```
 */
export function JOBJU_CONTROLLER_SCORE(
  params: JobjuControllerScoreParams
): ResultAsync<JobjuControllerScoreSuccess, JobjuControllerScoreFailure> {
  return new ResultAsync(
    (async (): Promise<
      Result<JobjuControllerScoreSuccess, JobjuControllerScoreFailure>
    > => {
      const response = await api.get("jobju/score", {
        searchParams: {
          symbol: params.symbol,
        },
      })
      const body: unknown = await response.json()

      switch (response.status) {
        case 200: {
          const result = JobjuControllerScoreResponse200Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "JobjuControllerScoreResponse200Schema",
              body,
              zodError: result.error,
            })
          }

          const value: JobjuControllerScoreSuccess = {
            status: 200,
            body: result.data,
          }

          return ok(value)
        }
        case 400: {
          const result = JobjuControllerScoreResponse400Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "JobjuControllerScoreResponse400Schema",
              body,
              zodError: result.error,
            })
          }

          const value: JobjuControllerScoreFailure = {
            status: 400,
            body: result.data,
          }

          return err(value)
        }
        case 404: {
          const result = JobjuControllerScoreResponse404Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "JobjuControllerScoreResponse404Schema",
              body,
              zodError: result.error,
            })
          }

          const value: JobjuControllerScoreFailure = {
            status: 404,
            body: result.data,
          }

          return err(value)
        }
        case 422: {
          const result = JobjuControllerScoreResponse422Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "JobjuControllerScoreResponse422Schema",
              body,
              zodError: result.error,
            })
          }

          const value: JobjuControllerScoreFailure = {
            status: 422,
            body: result.data,
          }

          return err(value)
        }
      }

      throw new ApiUnexpectedStatusError(response.status, body)
    })()
  )
}
