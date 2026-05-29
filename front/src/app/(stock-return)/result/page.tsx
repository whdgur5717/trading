import { RETURNS_CONTROLLER_CALCULATE } from "@/queries/generated"
import { ResultCard } from "../components/resultCard"
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

  return (
    <div className="grid w-full max-w-form gap-6">
      <ResultCard result={response.data} />
    </div>
  )
}
