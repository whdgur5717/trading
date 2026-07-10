"use client"

import {
  LineSeries,
  type ISeriesApi,
  type LineData,
  type LineSeriesPartialOptions,
  type Time,
} from "lightweight-charts"
import {
  useContext,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type Ref,
} from "react"

import { ChartContext } from "./chart-context"
import { resolveCssColors } from "./color"

type LineApi = ISeriesApi<"Line">

export type LineProps = {
  ref?: Ref<LineApi | null>
  data: LineData<Time>[]
  options?: LineSeriesPartialOptions
}

export function Line({ ref, data, options }: LineProps) {
  const context = useContext(ChartContext)
  const initialData = useRef(data)
  const initialOptions = useRef(options)
  const [line, setLine] = useState<LineApi | null>(null)

  useLayoutEffect(() => {
    if (!context) {
      return
    }

    const nextLine = context.chart.addSeries(
      LineSeries,
      resolveCssColors(context.root, initialOptions.current)
    )
    nextLine.setData(initialData.current)
    setLine(nextLine)

    return () => {
      if (context.alive.current) {
        context.chart.removeSeries(nextLine)
      }
    }
  }, [context])

  useLayoutEffect(() => {
    if (!line) {
      return
    }

    line.setData(data)
  }, [data, line])

  useLayoutEffect(() => {
    if (!context || !line || !options) {
      return
    }

    line.applyOptions(resolveCssColors(context.root, options))
  }, [context, line, options])

  useImperativeHandle<LineApi | null, LineApi | null>(ref, () => line, [line])

  if (!context) {
    throw new Error("Line must be rendered inside Chart.")
  }

  return null
}
