"use client"

import { createPickerField } from "@/components/picker-field"
import { searchStocksQueryOptions } from "@/queries/searchStocks"
import type { StockDto as Stock } from "@/queries/generated"
import { useQuery } from "@tanstack/react-query"
import { debounce, trim } from "es-toolkit"
import { ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"

export type { Stock }

type StockPickerProps = {
  value?: Stock
  onChange: (stock: Stock) => void
}

const Picker = createPickerField<Stock | null>("StockPicker")

export function StockPicker({ value, onChange }: StockPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [debouncedSetQuery] = useState(() => debounce(setDebouncedQuery, 300))

  useEffect(() => () => debouncedSetQuery.cancel(), [debouncedSetQuery])

  const { data: options = [], isFetching } = useQuery({
    ...searchStocksQueryOptions({ q: debouncedQuery }),
    enabled: debouncedQuery.length > 0,
  })

  return (
    <Picker.Root
      open={open}
      value={value ?? null}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)

        if (!nextOpen) return

        const nextQuery = value?.name ?? ""

        debouncedSetQuery.cancel()
        setQuery(nextQuery)
        setDebouncedQuery(nextQuery)
      }}
      onValueChange={(stock) => {
        if (!stock) return

        onChange(stock)
        debouncedSetQuery.cancel()
        setQuery(stock.name)
        setDebouncedQuery(stock.name)
      }}
    >
      <div className="relative">
        <Picker.Trigger asChild>
          {({ value: selectedStock }) => (
            <button>
              <span className="col-span-full text-caption font-extrabold text-muted">
                종목
              </span>
              {selectedStock ? (
                <>
                  <strong className="min-w-0 truncate text-title font-bold tracking-normal text-primary">
                    {selectedStock.name}
                  </strong>
                  <small className="flex items-end gap-2 pb-0.5 text-label font-bold text-muted">
                    {selectedStock.code}
                    <ChevronDown className="size-4 shrink-0 transition-transform duration-150 ease-standard group-data-[state=open]:rotate-180" />
                  </small>
                </>
              ) : (
                <>
                  <span className="min-w-0 truncate text-body font-medium tracking-normal text-subtle">
                    종목 선택
                  </span>
                  <small className="flex items-end gap-2 pb-0.5 text-label font-medium text-subtle">
                    검색
                    <ChevronDown className="size-4 shrink-0 transition-transform duration-150 ease-standard group-data-[state=open]:rotate-180" />
                  </small>
                </>
              )}
            </button>
          )}
        </Picker.Trigger>

        <Picker.Content align="start" asChild sideOffset={8}>
          <div className="space-y-3">
            <label className="grid gap-2 rounded-lg bg-surface-muted p-3">
              <span className="text-caption font-extrabold text-muted">
                종목 검색
              </span>
              <input
                autoFocus
                className="w-full bg-transparent p-0 font-sans text-body font-bold text-primary outline-none placeholder:text-subtle"
                onChange={(event) => {
                  const nextQuery = trim(event.target.value)

                  setQuery(event.target.value)

                  if (nextQuery.length === 0) {
                    debouncedSetQuery.cancel()
                    setDebouncedQuery("")
                    return
                  }

                  debouncedSetQuery(nextQuery)
                }}
                placeholder="삼성전자, 하이닉스, 005930"
                value={query}
              />
            </label>

            <div className="grid max-h-72 gap-1 overflow-y-auto">
              {options.length > 0 ? (
                options.map((stock) => (
                  <Picker.Item
                    asChild
                    className="grid items-start justify-start gap-1 p-3"
                    key={stock.code}
                    value={stock}
                  >
                    {() => (
                      <button>
                        <span className="text-body font-bold">
                          {stock.name}
                        </span>
                        <small className="text-caption font-bold text-muted transition-colors duration-150 ease-standard group-hover:text-primary-foreground/60 group-data-selected:text-primary-foreground/60">
                          {stock.code} · {stock.marketName}
                        </small>
                      </button>
                    )}
                  </Picker.Item>
                ))
              ) : isFetching ? (
                <p className="px-3 py-4 text-label font-bold text-muted">
                  검색 중입니다.
                </p>
              ) : (
                <p className="px-3 py-4 text-label font-bold text-muted">
                  선택할 수 있는 종목이 없습니다.
                </p>
              )}
            </div>
          </div>
        </Picker.Content>
      </div>
    </Picker.Root>
  )
}
