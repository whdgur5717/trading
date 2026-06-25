import { fscHandlers } from "./fsc/handlers"
import { kisHandlers } from "./kis/handlers"
import { opendartHandlers } from "./opendart/handlers"

interface ExternalHandlerOptions {
  readonly kisRestBaseUrl: string
}

export function externalHandlers({ kisRestBaseUrl }: ExternalHandlerOptions) {
  return [
    ...kisHandlers({ restBaseUrl: kisRestBaseUrl }),
    ...fscHandlers(),
    ...opendartHandlers(),
  ]
}
