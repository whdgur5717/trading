import { ApiSchemaError, ApiUnexpectedStatusError, api } from "../api"
import { ResultAsync, ok, type Result } from "neverthrow"
import {
  HealthControllerCheckResponse200Schema,
  type HealthControllerCheckResponse200,
} from "./schemas"

export type HealthControllerCheckSuccess = {
  status: 200
  body: HealthControllerCheckResponse200
}

export type HealthControllerCheckFailure = never

/**
 * @example
 * ```ts
 * await HEALTH_CONTROLLER_CHECK()
 * ```
 */
export function HEALTH_CONTROLLER_CHECK(): ResultAsync<
  HealthControllerCheckSuccess,
  HealthControllerCheckFailure
> {
  return ResultAsync.fromSafePromise(
    (async (): Promise<
      Result<HealthControllerCheckSuccess, HealthControllerCheckFailure>
    > => {
      const response = await api.get("health", {})
      const body: unknown = await response.json()

      switch (response.status) {
        case 200: {
          const result = HealthControllerCheckResponse200Schema.safeParse(body)

          if (!result.success) {
            throw new ApiSchemaError({
              status: response.status,
              schemaName: "HealthControllerCheckResponse200Schema",
              body,
              zodError: result.error,
            })
          }

          const value: HealthControllerCheckSuccess = {
            status: 200,
            body: result.data,
          }

          return ok(value)
        }
      }

      throw new ApiUnexpectedStatusError(response.status, body)
    })()
  ).andThen((result) => result)
}
