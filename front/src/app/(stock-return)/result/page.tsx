import { RETURNS_CONTROLLER_CALCULATE } from "@/queries/generated"
import { LiveResultCard } from "../components/liveResultCard"
import { stockReturnSearchParamsCache } from "./searchParams"

export default async function ResultPage({
  searchParams,
}: PageProps<"/result">) {
  const { code, buyDate, quantity } =
    await stockReturnSearchParamsCache.parse(searchParams)

  const response = await RETURNS_CONTROLLER_CALCULATE({
    code,
    buyDate,
    quantity,
  })

  return <LiveResultCard result={response.data} />
}
