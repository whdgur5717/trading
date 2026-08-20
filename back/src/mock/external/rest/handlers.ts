import { getFscMock } from "#generated/fsc/rest/api.msw"
import { scenarios as fscScenarios } from "#generated/fsc/rest/api.scenarios"
import { getKisRestApiMock } from "#generated/kis/rest/api.msw"
import { scenarios as kisScenarios } from "#generated/kis/rest/api.scenarios"
import { getOpenDARTMock } from "#generated/opendart/rest/api.msw"
import { scenarios as opendartScenarios } from "#generated/opendart/rest/api.scenarios"
import { kisOverrides } from "./kis.overrides"
import { scenarioHandlers } from "./scenario.handlers"

export function restHandlers() {
  return [
    ...scenarioHandlers({
      scenarios: kisScenarios,
      handlers: [...kisOverrides, ...getKisRestApiMock()],
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
