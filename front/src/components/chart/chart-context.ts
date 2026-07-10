import { createContext, type RefObject } from "react"
import type { IChartApi } from "lightweight-charts"

export type ChartContextValue = {
  chart: IChartApi
  alive: RefObject<boolean>
  root: HTMLElement
}

export const ChartContext = createContext<ChartContextValue | null>(null)
