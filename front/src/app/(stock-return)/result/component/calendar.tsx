"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

import { TradingCalendar } from "../../components/tradingCalendar"

type CalendarProps = {
  date: Date
}

export function Calendar({ date }: CalendarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [viewDate, setViewDate] = useState(date)

  return (
    <TradingCalendar
      selectedDate={date}
      viewDate={viewDate}
      onViewDateChange={setViewDate}
      onSelectDate={(selectedDate) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set(
          "buyDate",
          `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
        )
        router.replace(`${pathname}?${params.toString()}`)
      }}
    />
  )
}
