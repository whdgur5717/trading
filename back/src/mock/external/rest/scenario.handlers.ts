import { http, HttpResponse } from "msw"
import type { JsonBodyType, RequestHandler } from "msw"

interface ScenarioHandlersOptions {
  readonly scenarios: Readonly<
    Record<
      string,
      {
        readonly method: string
        readonly path: string
        readonly scenarios: Readonly<
          Record<
            string,
            {
              readonly status: number
              readonly body: JsonBodyType
            }
          >
        >
        readonly default: { readonly body: JsonBodyType }
      }
    >
  >
  readonly handlers: readonly RequestHandler[]
}

export function scenarioHandlers({
  scenarios,
  handlers,
}: ScenarioHandlersOptions): RequestHandler[] {
  return [
    ...Object.values(scenarios).map((operation) =>
      http.all(`*${operation.path}`, ({ request }) => {
        if (request.method.toLowerCase() !== operation.method) {
          return
        }

        const scenarioName = request.headers.get("x-mock-scenario")
        const statusValue = request.headers.get("x-mock-status")

        if ((scenarioName && statusValue) || (!scenarioName && !statusValue)) {
          return
        }

        if (scenarioName) {
          const scenario = operation.scenarios[scenarioName]

          if (!scenario) {
            return
          }

          return HttpResponse.json(scenario.body, { status: scenario.status })
        }

        const status = Number(statusValue)

        if (!Number.isInteger(status) || status < 400 || status > 599) {
          return
        }

        return HttpResponse.json(operation.default.body, { status })
      })
    ),
    ...handlers,
  ]
}
