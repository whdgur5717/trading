import * as Sentry from "@sentry/cloudflare"

// oxlint-disable-next-line typescript/ban-ts-comment -- Generated only after the OpenNext build.
// @ts-ignore `.open-next/worker.js` is generated during the OpenNext build.
import openNextWorker from "./.open-next/worker.js"

type Env = {
  NEXT_PUBLIC_SENTRY_DSN?: string
}

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: Boolean(env.NEXT_PUBLIC_SENTRY_DSN),
  }),
  openNextWorker
)
