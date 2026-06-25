import { setupServer } from "msw/node"
import { externalHandlers } from "./handlers"

interface ExternalServerOptions {
  readonly kisRestBaseUrl: string
}

export function createExternalServer(options: ExternalServerOptions) {
  return setupServer(...externalHandlers(options))
}
