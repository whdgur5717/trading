"use client"

import * as Autocomplete from "@/components/autocomplete"
import { Chip } from "@/components/chip"
import { searchStocksQueryOptions } from "@/queries/searchStocks"
import type { StockDto as Stock } from "@/queries/generated"
import { Delay } from "@suspensive/react"
import { useQuery } from "@tanstack/react-query"
import { debounce, trim } from "es-toolkit"
import { useEffect, useState } from "react"

export type { Stock }

type StockPickerProps = {
  value?: Stock
  onChange: (stock: Stock) => void
}

const KOSPI_TOP_STOCKS = [
  {
    symbol: "005930",
    quotationMarket: "KRX",
    marketName: "KOSPI",
    name: "삼성전자",
  },
  {
    symbol: "035420",
    quotationMarket: "KRX",
    marketName: "KOSPI",
    name: "NAVER",
  },
  {
    symbol: "035720",
    quotationMarket: "KRX",
    marketName: "KOSPI",
    name: "카카오",
  },
  {
    symbol: "000660",
    quotationMarket: "KRX",
    marketName: "KOSPI",
    name: "SK하이닉스",
  },
  {
    symbol: "402340",
    quotationMarket: "KRX",
    marketName: "KOSPI",
    name: "SK스퀘어",
  },
  {
    symbol: "005380",
    quotationMarket: "KRX",
    marketName: "KOSPI",
    name: "현대차",
  },
  {
    symbol: "009150",
    quotationMarket: "KRX",
    marketName: "KOSPI",
    name: "삼성전기",
  },
  {
    symbol: "373220",
    quotationMarket: "KRX",
    marketName: "KOSPI",
    name: "LG에너지솔루션",
  },
  {
    symbol: "032830",
    quotationMarket: "KRX",
    marketName: "KOSPI",
    name: "삼성생명",
  },
  {
    symbol: "028260",
    quotationMarket: "KRX",
    marketName: "KOSPI",
    name: "삼성물산",
  },
  {
    symbol: "329180",
    quotationMarket: "KRX",
    marketName: "KOSPI",
    name: "HD현대중공업",
  },
  {
    symbol: "105560",
    quotationMarket: "KRX",
    marketName: "KOSPI",
    name: "KB금융",
  },
] satisfies Stock[]

export function StockPicker({ value, onChange }: StockPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value?.name ?? "")
  const [debouncedQuery, setDebouncedQuery] = useState(value?.name ?? "")
  const [debouncedSetQuery] = useState(() => debounce(setDebouncedQuery, 300))

  useEffect(() => () => debouncedSetQuery.cancel(), [debouncedSetQuery])

  const {
    data: options = [],
    isError,
    isFetching,
  } = useQuery({
    ...searchStocksQueryOptions({ q: debouncedQuery }),
    enabled: debouncedQuery.length > 0,
    retry: false,
    throwOnError: false,
    placeholderData: (previousData, previousQuery) => {
      if (debouncedQuery.length === 0) {
        return undefined
      }

      const previousQueryKey = previousQuery?.queryKey
      const previousQueryText = previousQueryKey?.[2]

      if (typeof previousQueryText !== "string") {
        return undefined
      }

      return debouncedQuery.startsWith(previousQueryText) ||
        previousQueryText.startsWith(debouncedQuery)
        ? previousData
        : undefined
    },
  })

  return (
    <Autocomplete.Root
      filter={null}
      itemToStringValue={(stock) => stock.name}
      items={options}
      loopFocus={false}
      mode="none"
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
      }}
      onValueChange={(nextValue) => {
        const nextQuery = trim(nextValue)

        setQuery(nextValue)

        if (nextQuery.length === 0) {
          debouncedSetQuery.cancel()
          setDebouncedQuery("")
          return
        }

        debouncedSetQuery(nextQuery)
      }}
      openOnInputClick
      value={query}
    >
      <Autocomplete.Search>
        <Autocomplete.InputGroup>
          <Autocomplete.Input
            aria-label="종목"
            autoComplete="off"
            placeholder="주식종목이나 종목코드를 입력해주세요"
          />
          {value && query === value.name ? (
            <div className="flex items-end gap-2 pb-0.5">
              <span className="text-label font-bold text-muted">
                {value.symbol}
              </span>
            </div>
          ) : null}
        </Autocomplete.InputGroup>
      </Autocomplete.Search>

      <Autocomplete.Content positionerProps={{ align: "start", sideOffset: 8 }}>
        <div className="flex flex-wrap gap-2 pb-3">
          {KOSPI_TOP_STOCKS.map((stock) => (
            <Chip
              key={stock.symbol}
              onClick={() => {
                onChange(stock)
                debouncedSetQuery.cancel()
                setQuery(stock.name)
                setDebouncedQuery(stock.name)
                setOpen(false)
              }}
              selected={value?.symbol === stock.symbol}
            >
              {stock.name}
            </Chip>
          ))}
        </div>
        <Autocomplete.Results>
          {(() => {
            switch (true) {
              case debouncedQuery.length === 0:
                return null
              case isError:
                return (
                  <Autocomplete.Status className="text-tease">
                    다시 입력해주세요
                  </Autocomplete.Status>
                )
              case options.length > 0:
                return (
                  <Autocomplete.List key={debouncedQuery}>
                    {options.map((stock) => (
                      <Autocomplete.Item
                        key={stock.symbol}
                        onClick={() => {
                          onChange(stock)
                          debouncedSetQuery.cancel()
                          setQuery(stock.name)
                          setDebouncedQuery(stock.name)
                          setOpen(false)
                        }}
                        selected={value?.symbol === stock.symbol}
                        value={stock}
                      >
                        <Autocomplete.ItemTitle>
                          {stock.name}
                        </Autocomplete.ItemTitle>
                        <Autocomplete.ItemDescription>
                          {stock.symbol} · {stock.marketName}
                        </Autocomplete.ItemDescription>
                      </Autocomplete.Item>
                    ))}
                  </Autocomplete.List>
                )
              case isFetching:
                return (
                  <Delay
                    fallback={
                      <Autocomplete.Status
                        aria-hidden="true"
                        className="opacity-0"
                      >
                        검색 중입니다
                      </Autocomplete.Status>
                    }
                    ms={200}
                  >
                    <Autocomplete.Status>검색 중입니다</Autocomplete.Status>
                  </Delay>
                )
              default:
                return (
                  <Autocomplete.Status>
                    선택할 수 있는 종목이 없습니다
                  </Autocomplete.Status>
                )
            }
          })()}
        </Autocomplete.Results>
      </Autocomplete.Content>
    </Autocomplete.Root>
  )
}
