import { RETURNS_CONTROLLER_CHART } from "@/queries/generated"
import type { Metadata } from "next"
import { stockReturnSearchParamsCache } from "./searchParams"
import { ResultView } from "./component/view"

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

  const result = await RETURNS_CONTROLLER_CHART({
    symbol: code,
    buyDate,
    quantity,
  }).match(
    (response) => response.body.data,
    (response) => {
      throw response
    }
  )

  return <ResultView result={result} />
}
