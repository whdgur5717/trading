"use client"

import { useEffect, useState } from "react"

type EventStreamStatus = "idle" | "connecting" | "open" | "stale" | "error"

type EventStreamError = {
  message: string
  retryAfterMs?: number
}

type EventStreamMeta = {
  lastDataAt: number | null
  lastEventAt: number | null
  retryAfterMs: number | null
}

type EventStreamOptions<TData> = {
  enabled: boolean
  events: Record<string, (data: unknown) => TData | null>
  readError?: (data: unknown) => EventStreamError | null
  staleMs?: number
  url: string
}

const emptyMeta: EventStreamMeta = {
  lastDataAt: null,
  lastEventAt: null,
  retryAfterMs: null,
}

function errorFromUnknown(error: unknown): EventStreamError {
  return {
    message: error instanceof Error ? error.message : "Event stream failed",
  }
}

export function useEventStream<TData>({
  enabled,
  events,
  readError,
  staleMs = 30_000,
  url,
}: EventStreamOptions<TData>) {
  const [status, setStatus] = useState<EventStreamStatus>(
    enabled ? "connecting" : "idle"
  )
  const [data, setData] = useState<TData | null>(null)
  const [error, setError] = useState<EventStreamError | null>(null)
  const [meta, setMeta] = useState<EventStreamMeta>(emptyMeta)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const source = new EventSource(url)
    const handlers: Array<[string, EventListener]> = []

    source.onopen = () => {
      setStatus("open")
      setError(null)
    }

    source.onerror = (event) => {
      if (event instanceof MessageEvent && typeof event.data === "string") {
        return
      }

      setStatus("error")
      setError({ message: "Event stream disconnected" })
    }

    for (const [name, read] of Object.entries(events)) {
      const handler = ((event: MessageEvent) => {
        const now = Date.now()

        try {
          const payload = JSON.parse(event.data) as unknown
          const nextData = read(payload)

          setStatus("open")
          setError(null)
          setMeta((current) => ({
            ...current,
            lastDataAt: nextData === null ? current.lastDataAt : now,
            lastEventAt: now,
          }))

          if (nextData !== null) {
            setData(nextData)
          }
        } catch (eventError) {
          setStatus("error")
          setError(errorFromUnknown(eventError))
          setMeta((current) => ({
            ...current,
            lastEventAt: now,
          }))
        }
      }) as EventListener

      source.addEventListener(name, handler)
      handlers.push([name, handler])
    }

    if (readError) {
      const handler = ((event: MessageEvent) => {
        const now = Date.now()

        try {
          const payload = JSON.parse(event.data) as unknown
          const nextError = readError(payload) ?? {
            message: "Event stream failed",
          }

          setStatus("error")
          setError(nextError)
          setMeta((current) => ({
            ...current,
            lastEventAt: now,
            retryAfterMs: nextError.retryAfterMs ?? null,
          }))
          source.close()
        } catch (eventError) {
          setStatus("error")
          setError(errorFromUnknown(eventError))
          setMeta((current) => ({
            ...current,
            lastEventAt: now,
          }))
          source.close()
        }
      }) as EventListener

      source.addEventListener("error", handler)
      handlers.push(["error", handler])
    }

    const staleTimer = setInterval(
      () => {
        setMeta((current) => {
          if (
            current.lastEventAt !== null &&
            Date.now() - current.lastEventAt > staleMs
          ) {
            setStatus((currentStatus) =>
              currentStatus === "open" ? "stale" : currentStatus
            )
          }

          return current
        })
      },
      Math.min(staleMs, 5_000)
    )

    return () => {
      clearInterval(staleTimer)

      for (const [name, handler] of handlers) {
        source.removeEventListener(name, handler)
      }

      source.close()
    }
  }, [enabled, events, readError, staleMs, url])

  return {
    data,
    error,
    meta,
    status,
  }
}
