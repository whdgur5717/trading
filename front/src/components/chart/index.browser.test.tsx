import {
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
} from "lightweight-charts"
import { createRef } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render } from "vitest-browser-react"

import { Chart, Line } from "."

const data = [
  { time: "2024-01-02" as Time, value: 100 },
  { time: "2024-01-03" as Time, value: 105 },
  { time: "2024-01-04" as Time, value: 98 },
  { time: "2024-01-05" as Time, value: 112 },
] satisfies LineData<Time>[]

const nextData = [
  { time: "2024-01-02" as Time, value: 80 },
  { time: "2024-01-03" as Time, value: 84 },
  { time: "2024-01-04" as Time, value: 91 },
  { time: "2024-01-05" as Time, value: 88 },
] satisfies LineData<Time>[]

describe("Chart", () => {
  afterEach(async () => {
    document.documentElement.style.removeProperty("--chart-test-background")
    document.documentElement.style.removeProperty("--chart-test-line")
    document.documentElement.style.removeProperty("--chart-test-text")
    await cleanup()
  })

  it("renders a visible line from CSS variable colors", async () => {
    document.documentElement.style.setProperty(
      "--chart-test-background",
      "oklch(1 0 0)"
    )
    document.documentElement.style.setProperty(
      "--chart-test-line",
      "oklch(0.62 0.25 29)"
    )
    document.documentElement.style.setProperty(
      "--chart-test-text",
      "oklch(0 0 0)"
    )

    const screen = await render(
      <Chart
        data-testid="chart"
        options={{
          layout: {
            background: {
              type: ColorType.Solid,
              color: "var(--chart-test-background)",
            },
            textColor: "var(--chart-test-text)",
          },
          rightPriceScale: { visible: false },
          timeScale: { visible: false },
        }}
        style={{ height: 240, width: 400 }}
      >
        <Line
          data={data}
          options={{
            color: "var(--chart-test-line)",
            lineWidth: 3,
            lastValueVisible: false,
            priceLineVisible: false,
          }}
        />
      </Chart>
    )

    await expect
      .poll(() =>
        Array.from(screen.container.querySelectorAll("canvas")).some(
          (canvas) => {
            const context = canvas.getContext("2d", {
              willReadFrequently: true,
            })

            if (!context) {
              return false
            }

            const pixels = context.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            ).data

            for (let index = 0; index < pixels.length; index += 4) {
              if (
                pixels[index + 3] > 0 &&
                pixels[index] > 180 &&
                pixels[index + 1] < 90 &&
                pixels[index + 2] < 90
              ) {
                return true
              }
            }

            return false
          }
        )
      )
      .toBe(true)
  })

  it("exposes the chart and line APIs through refs", async () => {
    const chartRef = createRef<IChartApi | null>()
    const lineRef = createRef<ISeriesApi<"Line"> | null>()

    await render(
      <Chart ref={chartRef} style={{ height: 240, width: 400 }}>
        <Line ref={lineRef} data={data} />
      </Chart>
    )

    await expect.poll(() => chartRef.current !== null).toBe(true)
    await expect.poll(() => lineRef.current?.seriesType()).toBe("Line")

    expect(() => chartRef.current?.timeScale().fitContent()).not.toThrow()
    expect(lineRef.current?.data()).toEqual(data)
  })

  it("updates the existing line when data or options change", async () => {
    const lineRef = createRef<ISeriesApi<"Line"> | null>()
    const screen = await render(
      <Chart style={{ height: 240, width: 400 }}>
        <Line ref={lineRef} data={data} options={{ lineWidth: 1 }} />
      </Chart>
    )

    await screen.rerender(
      <Chart style={{ height: 240, width: 400 }}>
        <Line ref={lineRef} data={nextData} options={{ lineWidth: 4 }} />
      </Chart>
    )

    await expect.poll(() => lineRef.current?.data()).toEqual(nextData)
    await expect.poll(() => lineRef.current?.options().lineWidth).toBe(4)
  })

  it("removes chart canvases on unmount", async () => {
    const screen = await render(
      <Chart style={{ height: 240, width: 400 }}>
        <Line data={data} />
      </Chart>
    )

    await expect
      .poll(() => screen.container.querySelectorAll("canvas").length)
      .toBeGreaterThan(0)

    await screen.unmount()

    expect(screen.container.querySelector("canvas")).toBeNull()
  })
})
