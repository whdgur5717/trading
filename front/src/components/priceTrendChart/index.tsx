"use client"

import {
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type LineSeriesPartialOptions,
  type MouseEventHandler,
  type Time,
} from "lightweight-charts"
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"

import { Chart, Line } from "@/components/chart"
import { cn } from "@/utils/cn"

export type PriceTrendData = LineData<Time>

type PriceTrendChartContextValue = {
  chart: IChartApi
  data: PriceTrendData[]
  line: ISeriesApi<"Line">
  root: HTMLElement
}

type TooltipState = {
  visible: boolean
  time: string
  value: string
  x: number
  y: number
}

export type PriceTrendChartProps = {
  data: PriceTrendData[]
  children?: ReactNode
  className?: string
}

export type PriceTrendChartMarkerProps = {
  point: PriceTrendData | null | undefined
  children: ReactNode
}

const PriceTrendChartContext =
  createContext<PriceTrendChartContextValue | null>(null)

const tooltipWidth = 112
const tooltipHeight = 44
const tooltipMargin = 12

const hiddenTooltip = {
  visible: false,
  time: "",
  value: "",
  x: 0,
  y: 0,
} satisfies TooltipState

const defaultLineOptions = {
  color: "var(--color-primary)",
  lastValueVisible: false,
  lineWidth: 2,
  priceLineVisible: false,
} satisfies LineSeriesPartialOptions

function hasLineValue(value: unknown): value is LineData<Time> {
  return Boolean(value && typeof value === "object" && "value" in value)
}

function formatTime(time: Time) {
  return String(time).replaceAll("-", ".")
}

function formatValue(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(Math.round(value))}원`
}

function nextTooltipPosition(
  point: { x: number; y: number },
  root: HTMLElement
) {
  let x = point.x + tooltipMargin
  let y = point.y + tooltipMargin

  if (x > root.clientWidth - tooltipWidth) {
    x = point.x - tooltipMargin - tooltipWidth
  }

  if (y > root.clientHeight - tooltipHeight) {
    y = point.y - tooltipMargin - tooltipHeight
  }

  return {
    x: Math.max(tooltipMargin, Math.round(x)),
    y: Math.max(tooltipMargin, Math.round(y)),
  }
}

function sameTooltip(current: TooltipState, next: TooltipState) {
  return (
    current.visible === next.visible &&
    current.time === next.time &&
    current.value === next.value &&
    current.x === next.x &&
    current.y === next.y
  )
}

function PriceTrendChartRoot({
  data,
  children,
  className,
}: PriceTrendChartProps) {
  const [root, setRoot] = useState<HTMLDivElement | null>(null)
  const [chart, setChart] = useState<IChartApi | null>(null)
  const [line, setLine] = useState<ISeriesApi<"Line"> | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState>(hiddenTooltip)
  const chartOptions = useMemo(
    () => ({
      crosshair: {
        horzLine: { color: "var(--color-surface)", labelVisible: false },
        vertLine: { color: "var(--color-surface)", labelVisible: false },
      },
      grid: {
        horzLines: { visible: false },
        vertLines: { visible: false },
      },
      handleScale: false,
      handleScroll: false,
      layout: {
        attributionLogo: false,
        background: {
          type: ColorType.Solid,
          color: "var(--color-surface-muted)",
        },
        textColor: "var(--color-subtle)",
      },
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
    }),
    []
  )
  const context = useMemo(
    () => (chart && line && root ? { chart, data, line, root } : null),
    [chart, data, line, root]
  )
  const handleChartRef = useCallback((api: IChartApi | null) => {
    setChart((current) => (current === api ? current : api))
  }, [])
  const handleLineRef = useCallback((api: ISeriesApi<"Line"> | null) => {
    setLine((current) => (current === api ? current : api))
  }, [])
  const handleCrosshairMove = useCallback<MouseEventHandler<Time>>(
    (event) => {
      const point = line ? event.seriesData.get(line) : undefined

      if (!root || !event.point || !hasLineValue(point)) {
        setTooltip((current) =>
          current.visible ? { ...current, visible: false } : current
        )
        return
      }

      const position = nextTooltipPosition(event.point, root)
      const next = {
        visible: true,
        time: formatTime(point.time),
        value: formatValue(point.value),
        x: position.x,
        y: position.y,
      } satisfies TooltipState

      setTooltip((current) => (sameTooltip(current, next) ? current : next))
    },
    [line, root]
  )

  useLayoutEffect(() => {
    if (!chart) {
      return
    }

    chart.timeScale().fitContent()
  }, [chart, data])

  return (
    <div
      ref={setRoot}
      className={cn("relative isolate h-40 w-full", className)}
    >
      <Chart
        ref={handleChartRef}
        aria-label="가격 추세 차트"
        className="size-full overflow-hidden rounded-lg bg-surface-muted"
        onCrosshairMove={handleCrosshairMove}
        options={chartOptions}
        role="img"
      >
        <Line ref={handleLineRef} data={data} options={defaultLineOptions} />
      </Chart>
      {context ? (
        <PriceTrendChartContext.Provider value={context}>
          {children}
        </PriceTrendChartContext.Provider>
      ) : null}
      <div
        aria-hidden={!tooltip.visible}
        className="pointer-events-none absolute top-0 left-0 z-20 w-28 rounded-md bg-surface-raised/90 px-2 py-1 text-right type-label opacity-0 shadow-[0_8px_24px_oklch(0_0_0/0.28)] transition-opacity duration-100 ease-standard data-visible:opacity-100"
        data-visible={tooltip.visible ? "" : undefined}
        style={
          {
            "--tooltip-x": `${tooltip.x}px`,
            "--tooltip-y": `${tooltip.y}px`,
            transform: "translate3d(var(--tooltip-x), var(--tooltip-y), 0)",
          } as CSSProperties
        }
      >
        <span className="block text-subtle">{tooltip.time}</span>
        <span className="block text-ink">{tooltip.value}</span>
      </div>
    </div>
  )
}

function PriceTrendChartMarker({
  point,
  children,
}: PriceTrendChartMarkerProps) {
  const context = useContext(PriceTrendChartContext)
  const markerRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const marker = markerRef.current

    if (!context || !marker || !point) {
      return
    }

    let frame = 0
    const updatePosition = () => {
      const x = context.chart.timeScale().timeToCoordinate(point.time)
      const y = context.line.priceToCoordinate(point.value)

      if (x === null || y === null) {
        marker.style.opacity = "0"
        return
      }

      marker.style.opacity = "1"
      marker.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(
        y
      )}px, 0)`
    }

    frame = requestAnimationFrame(updatePosition)

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(updatePosition)
    })

    observer.observe(context.root)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [context, point])

  if (!context) {
    throw new Error(
      "PriceTrendChart.Marker must be rendered inside PriceTrendChart."
    )
  }

  return (
    <div
      ref={markerRef}
      className="pointer-events-none absolute top-0 left-0 z-10 opacity-0"
    >
      {children}
    </div>
  )
}

export const PriceTrendChart = Object.assign(PriceTrendChartRoot, {
  Marker: PriceTrendChartMarker,
})
