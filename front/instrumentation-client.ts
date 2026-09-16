import * as Sentry from "@sentry/nextjs"

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  integrations: [
    Sentry.captureConsoleIntegration({
      levels: ["error"],
    }),
  ],
  beforeSend(event, hint) {
    if (event.logger !== "console") {
      return event
    }

    return hint.originalException instanceof Error ? event : null
  },
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
