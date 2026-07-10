"use client"

import * as Calendar from "@/components/calendar"
import * as Select from "@/components/select"
import {
  y2020,
  y2021,
  y2022,
  y2023,
  y2024,
  y2025,
  y2026,
} from "@hyunbinseo/holidays-kr"
import { ChevronLeft, ChevronRight } from "lucide-react"

const HOLIDAYS_BY_YEAR = {
  2020: y2020,
  2021: y2021,
  2022: y2022,
  2023: y2023,
  2024: y2024,
  2025: y2025,
  2026: y2026,
} as const

const minSelectableDate = new Date(2020, 0, 1)
const months = Array.from({ length: 12 }, (_, index) => index + 1)

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

function parseMonthTimestamp(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime()
}

function getViewDateWithinRange(year: number, month: number, maxDate: Date) {
  const nextDate = new Date(year, month - 1, 1)
  const nextMonthTime = parseMonthTimestamp(nextDate)
  const minMonthTime = parseMonthTimestamp(minSelectableDate)
  const maxMonthTime = parseMonthTimestamp(maxDate)

  if (nextMonthTime < minMonthTime) {
    return new Date(
      minSelectableDate.getFullYear(),
      minSelectableDate.getMonth(),
      1
    )
  }

  if (nextMonthTime > maxMonthTime) {
    return new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
  }

  return nextDate
}

function isViewMonthDisabled(year: number, month: number, maxDate: Date) {
  const monthTime = parseMonthTimestamp(new Date(year, month - 1, 1))

  return (
    monthTime < parseMonthTimestamp(minSelectableDate) ||
    monthTime > parseMonthTimestamp(maxDate)
  )
}

type TradingCalendarHeaderProps = {
  viewDate: Date
  maxDate: Date
  onViewDateChange: (date: Date) => void
}

function TradingCalendarHeader({
  viewDate,
  maxDate,
  onViewDateChange,
}: TradingCalendarHeaderProps) {
  const viewYear = viewDate.getFullYear()
  const viewMonth = viewDate.getMonth() + 1
  const years = Array.from(
    { length: maxDate.getFullYear() - minSelectableDate.getFullYear() + 1 },
    (_, index) => minSelectableDate.getFullYear() + index
  )
  const previousMonthDisabled = isViewMonthDisabled(
    viewYear,
    viewMonth - 1,
    maxDate
  )
  const nextMonthDisabled = isViewMonthDisabled(
    viewYear,
    viewMonth + 1,
    maxDate
  )

  return (
    <div className="flex items-center justify-between px-1 pb-3">
      <button
        aria-label="이전 달"
        className="flex size-8 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:opacity-80 active:opacity-60 disabled:cursor-not-allowed disabled:text-disabled-foreground disabled:opacity-40 disabled:hover:bg-transparent [&_svg]:size-4"
        disabled={previousMonthDisabled}
        type="button"
        onClick={() =>
          onViewDateChange(
            getViewDateWithinRange(viewYear, viewMonth - 1, maxDate)
          )
        }
      >
        <ChevronLeft aria-hidden="true" />
      </button>

      <div className="flex min-w-0 items-center justify-center gap-2">
        <Select.Root
          value={viewYear}
          onValueChange={(year) => {
            if (year === null) return

            onViewDateChange(getViewDateWithinRange(year, viewMonth, maxDate))
          }}
        >
          <Select.Trigger
            aria-label="표시 연도"
            className="h-8 w-23 bg-transparent px-2 type-label hover:bg-transparent data-popup-open:bg-transparent"
          >
            <Select.Value>{(year) => `${year}년`}</Select.Value>
            <Select.Icon className="[&_svg]:size-4" />
          </Select.Trigger>
          <Select.Content
            portalled={false}
            className="max-h-56 w-23"
            positionerProps={{ alignItemWithTrigger: false, sideOffset: 4 }}
          >
            <Select.List>
              {years.map((year) => (
                <Select.Item
                  key={year}
                  value={year}
                  className="min-h-8 px-2 py-1.5 type-label"
                >
                  <Select.ItemText>{year}년</Select.ItemText>
                  <Select.ItemIndicator className="[&_svg]:size-4" />
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select.Root>

        <Select.Root
          value={viewMonth}
          onValueChange={(month) => {
            if (month === null) return

            onViewDateChange(getViewDateWithinRange(viewYear, month, maxDate))
          }}
        >
          <Select.Trigger
            aria-label="표시 월"
            className="h-8 w-20 bg-transparent px-2 type-label hover:bg-transparent data-popup-open:bg-transparent"
          >
            <Select.Value>{(month) => `${month}월`}</Select.Value>
            <Select.Icon className="[&_svg]:size-4" />
          </Select.Trigger>
          <Select.Content
            portalled={false}
            className="max-h-56 w-20"
            positionerProps={{ alignItemWithTrigger: false, sideOffset: 4 }}
          >
            <Select.List>
              {months.map((month) => (
                <Select.Item
                  key={month}
                  value={month}
                  className="min-h-8 px-2 py-1.5 type-label"
                  disabled={isViewMonthDisabled(viewYear, month, maxDate)}
                >
                  <Select.ItemText>{month}월</Select.ItemText>
                  <Select.ItemIndicator className="[&_svg]:size-4" />
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select.Root>
      </div>

      <button
        aria-label="다음 달"
        className="flex size-8 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:opacity-80 active:opacity-60 disabled:cursor-not-allowed disabled:text-disabled-foreground disabled:opacity-40 disabled:hover:bg-transparent [&_svg]:size-4"
        disabled={nextMonthDisabled}
        type="button"
        onClick={() =>
          onViewDateChange(
            getViewDateWithinRange(viewYear, viewMonth + 1, maxDate)
          )
        }
      >
        <ChevronRight aria-hidden="true" />
      </button>
    </div>
  )
}

export function TradingCalendar({
  selectedDate,
  viewDate,
  onSelectDate,
  onViewDateChange,
}: TradingCalendarProps) {
  const maxSelectableDate = new Date()

  return (
    <Calendar.Root
      date={selectedDate ?? viewDate}
      locale="ko-KR"
      maxDate={maxSelectableDate}
      minDate={minSelectableDate}
      type="single"
      viewDate={viewDate}
      weekStart={0}
      onViewDateChange={onViewDateChange}
      onDateChange={(date) => {
        if (!date) return
        onSelectDate(date)
      }}
    >
      <TradingCalendarHeader
        maxDate={maxSelectableDate}
        viewDate={viewDate}
        onViewDateChange={onViewDateChange}
      />
      <Calendar.Weekday />
      <Calendar.Days disabled={isMarketClosedDate} />
    </Calendar.Root>
  )
}
