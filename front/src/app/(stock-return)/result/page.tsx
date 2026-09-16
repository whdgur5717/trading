import { Button } from "@/components/button"
import { RETURNS_CONTROLLER_CHART } from "@/queries/generated"
import { CircleAlert } from "lucide-react"
import type { Metadata } from "next"
import { refresh } from "next/cache"
import Link from "next/link"
import { stockReturnSearchParamsCache } from "./searchParams"
import { Calendar } from "./component/calendar"
import { ResultView } from "./component/view"

async function retry() {
  "use server"

  refresh()
}

export async function generateMetadata({
  searchParams,
}: PageProps<"/result">): Promise<Metadata> {
  const { code, buyDate, quantity } =
    await stockReturnSearchParamsCache.parse(searchParams)
  const query = new URLSearchParams({
    code,
    buyDate,
    quantity: String(quantity),
  })
  const imageUrl = `/result/og?${query.toString()}`
  const title = "그때 샀다면"
  const description =
    code && buyDate && quantity > 0
      ? `${buyDate}에 ${code} ${quantity.toLocaleString("ko-KR")}주를 샀다면?`
      : "그때 그 종목을 샀다면 지금 얼마였을지 계산해보세요."

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "그때 샀다면 결과 카드",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function ResultPage({
  searchParams,
}: PageProps<"/result">) {
  const { code, buyDate, quantity } =
    await stockReturnSearchParamsCache.parse(searchParams)

  return RETURNS_CONTROLLER_CHART({
    symbol: code,
    buyDate,
    quantity,
  }).match(
    (response) => <ResultView result={response.body.data} />,
    (response) => {
      const message = (() => {
        switch (response.body.error.type) {
          case "stock.unsupported":
            return {
              title: "지원하지 않는 종목이에요",
              description: "현재 계산할 수 있는 다른 종목을 선택해주세요.",
            }
          case "market.data_not_found":
            return {
              title: "시세 데이터를 찾지 못했어요",
              description:
                "선택한 조건에 필요한 가격 기록이 없습니다. 날짜를 바꿔 다시 계산해주세요.",
            }
          case "returns.buy_price_not_found":
            return {
              title: "매수가를 찾지 못했어요",
              description:
                "휴장일이거나 가격 기록이 없는 날짜일 수 있습니다. 다른 날짜를 선택해주세요.",
            }
          case "market.provider_unavailable":
            return {
              title: "시세 데이터를 불러올 수 없어요",
              description:
                "시세 제공처를 현재 이용할 수 없습니다. 잠시 후 다시 시도해주세요.",
            }
          case "market.provider_auth_unavailable":
            return {
              title: "시세 데이터 연결이 원활하지 않아요",
              description:
                "시세 제공처와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
            }
          case "market.provider_invalid_response":
            return {
              title: "시세 데이터를 확인할 수 없어요",
              description:
                "시세 제공처의 응답을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.",
            }
          case "market.provider_timeout":
            return {
              title: "시세 응답이 늦어지고 있어요",
              description:
                "시세 제공처가 제한 시간 안에 응답하지 않았습니다. 잠시 후 다시 시도해주세요.",
            }
          default:
            return {
              title: "결과를 불러오지 못했어요",
              description:
                "일시적인 문제일 수 있습니다. 잠시 후 다시 시도해주세요.",
            }
        }
      })()

      return (
        <section
          className="flex w-full max-w-form flex-col items-center gap-8"
          aria-label="결과 오류"
        >
          <div className="flex max-w-result flex-col items-center gap-4 text-center">
            <span
              className="flex size-12 items-center justify-center rounded-full bg-surface-muted text-warning"
              aria-hidden="true"
            >
              <CircleAlert className="size-6" />
            </span>

            <div className="grid gap-2">
              <h1 className="type-title break-keep text-ink">
                {message.title}
              </h1>
              <p className="type-body text-pretty break-keep text-muted">
                {message.description}
              </p>
            </div>
          </div>

          <div className="grid w-full max-w-result gap-3">
            {response.body.error.type === "returns.buy_price_not_found" ? (
              <>
                <div className="rounded-xl bg-surface-muted/60 p-3">
                  <Calendar date={new Date(`${buyDate}T00:00:00`)} />
                </div>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/">처음으로 돌아가기</Link>
                </Button>
              </>
            ) : (
              <>
                <form action={retry}>
                  <Button className="w-full" size="lg" type="submit">
                    다시 시도하기
                  </Button>
                </form>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/">처음으로 돌아가기</Link>
                </Button>
              </>
            )}
          </div>
        </section>
      )
    }
  )
}
