"use client"

import * as Calendar from "@/components/calendar"
import {
  y2020,
  y2021,
  y2022,
  y2023,
  y2024,
  y2025,
  y2026,
} from "@hyunbinseo/holidays-kr"

const HOLIDAYS_BY_YEAR = {
  2020: y2020,
  2021: y2021,
  2022: y2022,
  2023: y2023,
  2024: y2024,
  2025: y2025,
  2026: y2026,
} as const

type TradingCalendarProps = {
  selectedDate?: Calendar.CalendarRootProps["date"]
  viewDate: NonNullable<Calendar.CalendarRootProps["viewDate"]>
  onSelectDate: (date: NonNullable<Calendar.CalendarRootProps["date"]>) => void
  onViewDateChange: NonNullable<Calendar.CalendarRootProps["onViewDateChange"]>
}

function isWeekend(date: Date) {
  const day = date.getDay()

  return day === 0 || day === 6
}

function isPublicHoliday(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const dayOfMonth = date.getDate()
  const holidays =
    year in HOLIDAYS_BY_YEAR
      ? HOLIDAYS_BY_YEAR[year as keyof typeof HOLIDAYS_BY_YEAR]
      : undefined
  const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(dayOfMonth).padStart(2, "0")}`

  return holidays !== undefined && dateKey in holidays
}

function isYearEndClosedDate(date: Date) {
  return date.getMonth() === 11 && date.getDate() === 31
}

function isMarketClosedDate(date: Date) {
  return isWeekend(date) || isPublicHoliday(date) || isYearEndClosedDate(date)
}

export function TradingCalendar({
  selectedDate,
  viewDate,
  onSelectDate,
  onViewDateChange,
}: TradingCalendarProps) {
  return (
    <Calendar.Root
      date={selectedDate ?? viewDate}
      locale="ko-KR"
      maxDate={new Date()}
      minDate={new Date(2020, 0, 1)}
      type="single"
      viewDate={viewDate}
      weekStart={0}
      onViewDateChange={onViewDateChange}
      onDateChange={(date) => {
        if (!date) return
        onSelectDate(date)
      }}
    >
      <Calendar.Header
        render={(date) => `${date.getFullYear()}년 ${date.getMonth() + 1}월`}
      />
      <div className="px-1 pb-3 type-label text-muted">거래일만 선택</div>
      <Calendar.Weekday />
      <Calendar.Days disabled={isMarketClosedDate} />
    </Calendar.Root>
  )
}
