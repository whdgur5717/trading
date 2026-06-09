"use client"

import { Chip } from "@/components/chip"
import { Input } from "@/components/input"
import { useRouter } from "next/navigation"
import { createSerializer, parseAsInteger, parseAsString } from "nuqs"
import { useState } from "react"
import { PurchaseDatePicker } from "./components/purchaseDatePicker"
import { StockPicker, type Stock } from "./components/stockPicker"

const quickQuantities = [1, 10, 50, 100]
const serializeResultUrl = createSerializer({
  code: parseAsString,
  buyDate: parseAsString,
  quantity: parseAsInteger,
})

function formatApiDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
}

export default function Home() {
  const router = useRouter()
  const [selectedStock, setSelectedStock] = useState<Stock>()
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [quantity, setQuantity] = useState(0)

  const stockCode = selectedStock?.code
  const resultUrl =
    stockCode !== undefined && selectedDate !== undefined && quantity > 0
      ? serializeResultUrl("/result", {
          code: stockCode,
          buyDate: formatApiDate(selectedDate),
          quantity,
        })
      : undefined

  return (
    <div className="grid w-full max-w-form gap-6">
      <section
        className="grid gap-5 rounded-2xl bg-surface-raised p-xl"
        aria-label="계산 입력"
      >
        <div className="grid gap-4">
          <StockPicker
            value={selectedStock}
            onChange={(stock) => {
              setSelectedStock(stock)
            }}
          />

          <PurchaseDatePicker
            value={selectedDate}
            onChange={(date) => {
              setSelectedDate(date)
            }}
          />

          <Input
            inputMode="numeric"
            min={1}
            onChange={(event) => {
              setQuantity(Number(event.currentTarget.value))
            }}
            placeholder="수량을 입력해주세요"
            step={1}
            trailing="주"
            type="number"
            value={quantity || ""}
          />

          <div className="flex flex-wrap gap-2" aria-label="빠른 수량 선택">
            {quickQuantities.map((value) => (
              <Chip
                key={value}
                onClick={() => {
                  setQuantity(value)
                }}
                selected={quantity === value}
              >
                {value.toLocaleString("ko-KR")}주
              </Chip>
            ))}
          </div>
        </div>

        <button
          className="min-h-touch cursor-pointer rounded-xl bg-primary px-5 py-3 type-body text-primary-foreground transition-colors duration-150 ease-standard hover:bg-primary/90 active:bg-primary/80 disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground"
          disabled={resultUrl === undefined}
          onClick={resultUrl ? () => router.push(resultUrl) : undefined}
          type="button"
        >
          계산하기
        </button>
      </section>
    </div>
  )
}
