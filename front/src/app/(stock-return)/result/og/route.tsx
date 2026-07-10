import { RETURNS_CONTROLLER_CHART } from "@/queries/generated"
import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

const colors = {
  bg: "#070707",
  surface: "#2d2833",
  surfaceMuted: "#26222d",
  ink: "#f2f0f3",
  muted: "#bbb4c1",
  primary: "#c9ef4e",
  gain: "#6f9de8",
  loss: "#e45f3b",
} as const

const numberFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
})

const rateFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 2,
})

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code") ?? ""
  const buyDate = searchParams.get("buyDate") ?? ""
  const quantity = Number(searchParams.get("quantity") ?? 0) || 0

  const result =
    code && buyDate && quantity > 0
      ? await RETURNS_CONTROLLER_CHART({
          symbol: code,
          buyDate,
          quantity,
        })
          .match(
            (response) => response.body.data,
            () => null
          )
          .catch(() => null)
      : null

  const fontData = await fetch(
    new URL("/fonts/pretendard/Pretendard-ExtraBold.woff", request.url)
  ).then((response) => response.arrayBuffer())

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors.bg,
        color: colors.ink,
        fontFamily: "Pretendard",
        padding: 56,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderRadius: 16,
          background: colors.surface,
          border: `1px solid ${colors.surfaceMuted}`,
          padding: 56,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: colors.muted,
            fontSize: 30,
            fontWeight: 700,
          }}
        >
          <span>그때 샀다면</span>
          <span style={{ color: colors.primary }}>ittaesalgeol.com</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div
            style={{
              color:
                result === null
                  ? colors.primary
                  : result.result.profit > 0
                    ? colors.gain
                    : result.result.profit < 0
                      ? colors.loss
                      : colors.primary,
              fontSize: 112,
              fontWeight: 800,
              letterSpacing: 0,
              lineHeight: 0.95,
            }}
          >
            {result === null
              ? "결과 없음"
              : `${result.result.profit > 0 ? "+" : result.result.profit < 0 ? "-" : ""}${
                  Math.abs(Math.round(result.result.profit)) >= 100_000_000
                    ? `${(
                        Math.abs(Math.round(result.result.profit)) / 100_000_000
                      ).toLocaleString("ko-KR", {
                        maximumFractionDigits: 1,
                      })}억원`
                    : Math.abs(Math.round(result.result.profit)) >= 10_000_000
                      ? `${Math.round(
                          Math.abs(Math.round(result.result.profit)) / 10_000
                        ).toLocaleString("ko-KR")}만원`
                      : `${numberFormatter.format(Math.abs(Math.round(result.result.profit)))}원`
                }`}
          </div>
          <div
            style={{
              color: colors.ink,
              fontSize: 44,
              fontWeight: 800,
              lineHeight: 1.15,
            }}
          >
            {result === null
              ? ""
              : `수익률 ${result.result.profitRate > 0 ? "+" : result.result.profitRate < 0 ? "-" : ""}${rateFormatter.format(
                  Math.abs(result.result.profitRate)
                )}%`}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            borderRadius: 16,
            background: colors.surfaceMuted,
            padding: "24px 28px",
            color: colors.muted,
            fontSize: 30,
            fontWeight: 700,
          }}
        >
          <span>
            {(result?.buy.date ?? buyDate).replace(
              /^(\d{4})-(\d{2})-(\d{2})$/,
              "$1.$2.$3"
            )}{" "}
            · {result?.stock.name ?? code}{" "}
            {numberFormatter.format(result?.buy.quantity ?? quantity)}주
          </span>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Pretendard",
          data: fontData,
          style: "normal",
          weight: 800,
        },
      ],
    }
  )
}
