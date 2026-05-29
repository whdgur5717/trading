"use client"

import { Chip } from "@/components/chip"
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
        className="grid gap-5 rounded-2xl bg-surface-raised p-panel shadow-panel"
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

          <label className="grid min-h-field w-full grid-cols-[minmax(0,1fr)_auto] items-end gap-x-3 gap-y-1 rounded-xl bg-surface-muted px-4 py-3 text-primary transition-colors duration-150 ease-standard focus-within:bg-surface-hover">
            <span className="col-span-full text-caption font-extrabold text-muted">
              수량
            </span>
            <input
              className="min-w-0 border-0 bg-transparent p-0 font-sans text-title font-bold tracking-normal text-primary outline-none placeholder:text-subtle"
              inputMode="numeric"
              min={1}
              onChange={(event) => {
                setQuantity(Number(event.currentTarget.value))
              }}
              step={1}
              type="number"
              value={quantity || ""}
            />
            <strong className="pb-0.5 text-label font-bold text-muted">
              주
            </strong>
          </label>

          <div className="flex flex-wrap gap-2" aria-label="빠른 수량 선택">
            {quickQuantities.map((value) => (
              <Chip
                className="min-h-tap cursor-pointer rounded-lg bg-surface-muted px-3 text-label font-bold text-secondary transition-colors duration-150 ease-standard hover:bg-surface-hover data-selected:bg-primary data-selected:text-primary-foreground"
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
          className="min-h-tap cursor-pointer rounded-xl bg-primary px-5 py-3 text-body font-bold text-primary-foreground transition-colors duration-150 ease-standard hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground"
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
