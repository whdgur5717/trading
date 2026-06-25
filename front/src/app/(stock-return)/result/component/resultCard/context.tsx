"use client"

import { Context } from "radix-ui/internal"

import type { ResultCardStatus } from "."

type ResultCardContextValue = {
  status: ResultCardStatus
}

export const [ResultCardStatusProvider, useResultCardContext] =
  Context.createContext<ResultCardContextValue>("ResultCard")
