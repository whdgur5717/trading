export const MARKET_SESSIONS = [
  { session: "PRE_MARKET", startsAt: "08:00:00", endsAt: "09:00:00" },
  {
    session: "REGULAR_MARKET",
    startsAt: "09:00:00",
    endsAt: "15:30:00",
  },
  {
    session: "AFTER_MARKET",
    startsAt: "15:30:00",
    endsAt: "20:00:00",
  },
  { session: "CLOSED", startsAt: null, endsAt: null },
] as const

export type MarketSession = (typeof MARKET_SESSIONS)[number]["session"]
