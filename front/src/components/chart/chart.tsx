"use client"

import {
  createChart,
  type ChartOptions,
  type DeepPartial,
  type IChartApi,
  type MouseEventHandler,
  type Time,
} from "lightweight-charts"
import {
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type Ref,
} from "react"

import { ChartContext } from "./chart-context"
import { resolveCssColors } from "./color"

export type ChartProps = Omit<
  ComponentProps<"div">,
  "children" | "onClick" | "ref"
> & {
  ref?: Ref<IChartApi | null>
  options?: DeepPartial<ChartOptions>
  children?: ReactNode
  onClick?: MouseEventHandler<Time>
  onCrosshairMove?: MouseEventHandler<Time>
}

export function Chart({
  ref,
  options,
  children,
  onClick,
  onCrosshairMove,
  ...containerProps
}: ChartProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [chart, setChart] = useState<IChartApi | null>(null)
  const initialOptions = useRef(options)
  const alive = useRef(false)
  const context = useMemo(
    () => (chart && container ? { chart, alive, root: container } : null),
    [chart, container, alive]
  )

  useLayoutEffect(() => {
    if (!container) {
      return
    }

    const nextChart = createChart(
      container,
      resolveCssColors(container, initialOptions.current)
    )
    alive.current = true
    setChart(nextChart)

    return () => {
      alive.current = false
      nextChart.remove()
    }
  }, [container])

  useLayoutEffect(() => {
    if (!chart || !container || !options) {
      return
    }

    chart.applyOptions(resolveCssColors(container, options))
  }, [chart, container, options])

  useLayoutEffect(() => {
    if (!chart || !onClick) {
      return
    }

    chart.subscribeClick(onClick)

    return () => {
      chart.unsubscribeClick(onClick)
    }
  }, [chart, onClick])

  useLayoutEffect(() => {
    if (!chart || !onCrosshairMove) {
      return
    }

    chart.subscribeCrosshairMove(onCrosshairMove)

    return () => {
      chart.unsubscribeCrosshairMove(onCrosshairMove)
    }
  }, [chart, onCrosshairMove])

  useLayoutEffect(() => {
    if (!container || !chart) {
      return
    }

    const resize = () => {
      const { height, width } = container.getBoundingClientRect()

      if (width > 0 && height > 0) {
        chart.resize(Math.floor(width), Math.floor(height), true)
      }
    }

    resize()

    const observer = new ResizeObserver(resize)
    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [chart, container])

  useImperativeHandle<IChartApi | null, IChartApi | null>(ref, () => chart, [
    chart,
  ])

  return (
    <div ref={setContainer} {...containerProps}>
      {context ? (
        <ChartContext.Provider value={context}>
          {children}
        </ChartContext.Provider>
      ) : null}
    </div>
  )
}
