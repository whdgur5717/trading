import { Injectable } from "@nestjs/common"
import { err, ok, type Result } from "neverthrow"
import {
  catchError,
  concat,
  connect,
  defer,
  distinctUntilChanged,
  EMPTY,
  expand,
  from,
  map,
  merge,
  type Observable,
  of,
  ReplaySubject,
  share,
  switchMap,
  timer,
} from "rxjs"
import type { ExternalError } from "../external/error"
import { ExternalService } from "../external/external.service"
import type { MarketDay, StockSymbol, TradingDate } from "../external/schema"
import {
  REALTIME_ERRORS,
  type RealtimeErrorCode,
  type RealtimeEvent,
} from "./event"
import { MARKET_SESSIONS, type MarketSession } from "./market-session"

const DAY_MS = 24 * 60 * 60 * 1_000

// 현재는 단순한 이름 변환이지만 External 오류와 공개 계약을 분리하기 위해 명시적으로 매핑한다.
const EXTERNAL_ERROR_TO_REALTIME_ERROR = {
  "market.provider_unavailable": "MARKET_SESSION_UNAVAILABLE",
  "market.provider_auth_unavailable": "MARKET_SESSION_AUTH_UNAVAILABLE",
  "market.provider_timeout": "MARKET_SESSION_TIMEOUT",
  "market.provider_invalid_response": "MARKET_SESSION_INVALID_RESPONSE",
  "market.data_not_found": "MARKET_SESSION_NOT_FOUND",
} as const satisfies Record<ExternalError["type"], RealtimeErrorCode>

const KST_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
})

type MarketSessionResolution = {
  session: MarketSession
  nextTransitionAt: Date
}

@Injectable()
export class RealtimeService {
  private marketSessions: Observable<Result<MarketSession, ExternalError>>
  private marketDay: MarketDay | undefined

  constructor(private external: ExternalService) {
    this.marketSessions = defer(() =>
      this.resolveMarketSession(new Date())
    ).pipe(
      expand((result) => {
        if (result.isErr()) {
          return EMPTY
        }

        return timer(
          Math.max(0, result.value.nextTransitionAt.getTime() - Date.now())
        ).pipe(switchMap(() => this.resolveMarketSession(new Date())))
      }),
      map((result) => result.map(({ session }) => session)),
      distinctUntilChanged(
        (previous, current) =>
          previous.isOk() && current.isOk() && previous.value === current.value
      ),
      share({
        connector: () => new ReplaySubject(1),
        resetOnError: true,
        resetOnComplete: true,
        resetOnRefCountZero: true,
      })
    )
  }

  watch(symbols: StockSymbol[]): Observable<RealtimeEvent> {
    const subscribed = from(symbols).pipe(
      map((symbol): RealtimeEvent => ({ type: "subscribed", symbol }))
    )

    const live = this.marketSessions.pipe(
      connect((sessions) =>
        merge(
          sessions.pipe(map((result) => this.toMarketEvent(result))),
          sessions.pipe(
            map((result) => result.isOk() && result.value !== "CLOSED"),
            distinctUntilChanged(),
            switchMap((marketIsOpen) =>
              marketIsOpen ? this.tradeEvents(symbols) : EMPTY
            )
          )
        )
      )
    )

    return concat(subscribed, live).pipe(
      catchError(
        (): Observable<RealtimeEvent> =>
          of({
            type: "unavailable",
            code: "FEED_UNAVAILABLE",
            message: REALTIME_ERRORS.FEED_UNAVAILABLE.message,
            retryAfterMs: 0,
          })
      )
    )
  }

  private tradeEvents(symbols: StockSymbol[]): Observable<RealtimeEvent> {
    return this.external.tradeStream(symbols).pipe(
      map((event): RealtimeEvent => {
        switch (event.type) {
          case "trade":
            return { type: "trade", trade: event.trade }
          case "disconnected":
            return {
              type: "disconnected",
              closeCode: event.closeCode,
              reason: event.reason,
            }
          case "reconnected":
            return { type: "reconnected", symbols: [...symbols].sort() }
          case "unavailable":
            return {
              type: "unavailable",
              code: "FEED_UNAVAILABLE",
              message: REALTIME_ERRORS.FEED_UNAVAILABLE.message,
              retryAfterMs: event.retryAfterMs,
            }
        }
      })
    )
  }

  private toMarketEvent(
    result: Result<MarketSession, ExternalError>
  ): RealtimeEvent {
    if (result.isErr()) {
      const code = EXTERNAL_ERROR_TO_REALTIME_ERROR[result.error.type]

      return {
        type: "unavailable",
        code,
        message: REALTIME_ERRORS[code].message,
        retryAfterMs: 0,
      }
    }

    return { type: "market", session: result.value }
  }

  private async resolveMarketSession(
    now: Date
  ): Promise<Result<MarketSessionResolution, ExternalError>> {
    const { date, time } = kstClock(now)
    const marketDay = await this.getMarketDay(date)
    if (marketDay.isErr()) {
      return err(marketDay.error)
    }

    const marketIsOpen =
      marketDay.value.isTradingDay && marketDay.value.isOpenDay
    const current = marketIsOpen
      ? MARKET_SESSIONS.find(
          ({ startsAt, endsAt }) =>
            startsAt !== null &&
            endsAt !== null &&
            time >= startsAt &&
            time < endsAt
        )
      : undefined
    const next = marketIsOpen
      ? MARKET_SESSIONS.find(
          ({ startsAt }) => startsAt !== null && time < startsAt
        )
      : undefined
    const nextDate =
      current || next
        ? date
        : kstClock(
            new Date(new Date(`${date}T00:00:00+09:00`).getTime() + DAY_MS)
          ).date
    const nextTime =
      current?.endsAt ?? next?.startsAt ?? MARKET_SESSIONS[0].startsAt

    return ok({
      session: current?.session ?? "CLOSED",
      nextTransitionAt: new Date(`${nextDate}T${nextTime}+09:00`),
    })
  }

  private async getMarketDay(
    date: TradingDate
  ): Promise<Result<MarketDay, ExternalError>> {
    if (this.marketDay?.date === date) {
      return ok(this.marketDay)
    }

    const result = await this.external.marketDay({ date })
    return result.map((day) => {
      this.marketDay = day
      return day
    })
  }
}

function kstClock(at: Date): {
  date: TradingDate
  time: string
} {
  const parts = Object.fromEntries(
    KST_DATE_TIME_FORMATTER.formatToParts(at)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value])
  )

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
  }
}
