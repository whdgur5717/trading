"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"

import {
  REALTIME_CONTROLLER_STREAM,
  RealtimeControllerStreamEventSchema,
  type RealtimeControllerStreamEvent,
  type RealtimePriceDto,
} from "@/queries/generated"

export type EventStreamStatus =
  | "idle"
  | "connecting"
  | "open"
  | "reconnecting"
  | "stale"
  | "error"

type RealtimeErrorEvent = Extract<
  RealtimeControllerStreamEvent,
  { event: "error" }
>

export type EventStreamError = RealtimeErrorEvent["data"] | { message: string }

type EventStreamMeta = {
  lastEvent: RealtimeControllerStreamEvent | null
  lastEventAt: number | null
  lastPriceAt: number | null
}

type EventStreamState = {
  symbol: string
  status: EventStreamStatus
  error: EventStreamError | null
  readyState: number | null
  meta: EventStreamMeta
}

const realtimeEventNames = [
  "subscribed",
  "price",
  "heartbeat",
  "disconnected",
  "reconnected",
  "error",
] as const

const staleMs = 30_000

const emptyMeta: EventStreamMeta = {
  lastEvent: null,
  lastEventAt: null,
  lastPriceAt: null,
}

export function useEventStream(symbol: string) {
  const queryClient = useQueryClient()
  const lastEventAtRef = useRef<number | null>(null)
  const [stream, setStream] = useState<EventStreamState>({
    symbol,
    status: symbol ? "connecting" : "idle",
    error: null,
    readyState: null,
    meta: emptyMeta,
  })
  const [connectionVersion, setConnectionVersion] = useState(0)
  const priceQuery = useQuery<RealtimePriceDto | null>({
    queryKey: ["realtime", "stock-price", symbol],
    queryFn: () => null,
    enabled: false,
    initialData: null,
  })

  useEffect(() => {
    let closedIntentionally = false
    lastEventAtRef.current = null

    if (!symbol) {
      return
    }

    const eventSource = REALTIME_CONTROLLER_STREAM({ symbols: symbol })

    eventSource.onopen = () => {
      setStream({
        symbol,
        status: "open",
        error: null,
        readyState: eventSource.readyState,
        meta: emptyMeta,
      })
    }

    eventSource.onerror = (event) => {
      if (event instanceof MessageEvent) {
        return
      }

      if (closedIntentionally) {
        return
      }

      setStream((current) => ({
        ...current,
        symbol,
        status:
          eventSource.readyState === EventSource.CONNECTING
            ? "reconnecting"
            : "error",
        error:
          eventSource.readyState === EventSource.CONNECTING
            ? null
            : { message: "Realtime stream disconnected" },
        readyState: eventSource.readyState,
      }))
    }

    for (const eventName of realtimeEventNames) {
      eventSource.addEventListener(eventName, (event) => {
        if (closedIntentionally) {
          return
        }

        const now = Date.now()

        try {
          if (eventName === "error" && !(event instanceof MessageEvent)) {
            return
          }

          const messageEvent = event as MessageEvent<string>
          const data = JSON.parse(messageEvent.data) as unknown

          const realtimeEvent = RealtimeControllerStreamEventSchema.parse({
            event: eventName,
            data,
          })

          lastEventAtRef.current = now

          if (realtimeEvent.event === "error") {
            closedIntentionally = true
            eventSource.close()
            setStream((current) => ({
              symbol,
              status: "error",
              error: realtimeEvent.data,
              readyState: EventSource.CLOSED,
              meta: {
                ...current.meta,
                lastEvent: realtimeEvent,
                lastEventAt: now,
              },
            }))
            return
          }

          if (realtimeEvent.event === "price") {
            queryClient.setQueryData(
              ["realtime", "stock-price", symbol],
              realtimeEvent.data
            )
          }

          setStream((current) => ({
            symbol,
            status:
              realtimeEvent.event === "disconnected" ||
              (realtimeEvent.event === "heartbeat" &&
                current.status === "reconnecting")
                ? "reconnecting"
                : "open",
            error: null,
            readyState: eventSource.readyState,
            meta: {
              ...current.meta,
              lastEvent: realtimeEvent,
              lastEventAt: now,
              lastPriceAt:
                realtimeEvent.event === "price"
                  ? now
                  : current.meta.lastPriceAt,
            },
          }))
        } catch (eventError) {
          closedIntentionally = true
          eventSource.close()
          setStream((current) => ({
            symbol,
            status: "error",
            error: {
              message:
                eventError instanceof Error
                  ? eventError.message
                  : "Realtime stream failed",
            },
            readyState: EventSource.CLOSED,
            meta: current.meta,
          }))
        }
      })
    }

    const staleTimer = setInterval(() => {
      const lastEventAt = lastEventAtRef.current

      if (lastEventAt !== null && Date.now() - lastEventAt > staleMs) {
        setStream((current) =>
          current.symbol === symbol && current.status === "open"
            ? { ...current, status: "stale" }
            : current
        )
      }
    }, 5_000)

    return () => {
      closedIntentionally = true
      clearInterval(staleTimer)
      eventSource.close()
    }
  }, [connectionVersion, queryClient, symbol])

  const snapshot: EventStreamState =
    stream.symbol === symbol
      ? stream
      : {
          symbol,
          status: symbol ? "connecting" : "idle",
          error: null,
          readyState: null,
          meta: emptyMeta,
        }
  const isFetching =
    snapshot.status === "connecting" || snapshot.status === "reconnecting"

  return {
    data: priceQuery.data,
    error: snapshot.error,
    isConnecting: snapshot.status === "connecting",
    isError: snapshot.status === "error",
    isFetching,
    isIdle: snapshot.status === "idle",
    isLoading: snapshot.status === "connecting" && priceQuery.data === null,
    isOpen: snapshot.status === "open",
    isReconnecting: snapshot.status === "reconnecting",
    isStale: snapshot.status === "stale",
    lastEvent: snapshot.meta.lastEvent,
    lastEventAt: snapshot.meta.lastEventAt,
    lastPriceAt: snapshot.meta.lastPriceAt,
    readyState: snapshot.readyState,
    reconnect: () => {
      setStream({
        symbol,
        status: symbol ? "connecting" : "idle",
        error: null,
        readyState: null,
        meta: emptyMeta,
      })
      setConnectionVersion((current) => current + 1)
    },
    status: snapshot.status,
  }
}
