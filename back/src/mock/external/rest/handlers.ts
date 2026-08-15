import { getFscMock } from "../../../../openapi/fsc/rest/api.msw"
import { scenarios as fscScenarios } from "../../../../openapi/fsc/rest/api.scenarios"
import { getKisRestApiMock } from "../../../../openapi/kis/rest/api.msw"
import { scenarios as kisScenarios } from "../../../../openapi/kis/rest/api.scenarios"
import { getOpenDARTMock } from "../../../../openapi/opendart/rest/api.msw"
import { scenarios as opendartScenarios } from "../../../../openapi/opendart/rest/api.scenarios"
import { scenarioHandlers } from "./scenario.handlers"

export function restHandlers() {
  return [
    ...scenarioHandlers({
      scenarios: kisScenarios,
      handlers: getKisRestApiMock(),
    }),
    ...scenarioHandlers({
      scenarios: opendartScenarios,
      handlers: getOpenDARTMock(),
    }),
    ...scenarioHandlers({
      scenarios: fscScenarios,
      handlers: getFscMock(),
    }),
  ]
}
