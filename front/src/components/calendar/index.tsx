"use client"

import { cn } from "@/utils/cn"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Context, useControllableState } from "radix-ui/internal"
import {
  type ComponentPropsWithoutRef,
  forwardRef,
  type ReactNode,
  useCallback,
  useMemo,
} from "react"

import { calendar } from "./styles"

const styles = calendar()

type DateFormat = {
  year: number
  month: number
  day: number
  daysInMonth: number
  daysInPrevMonth: number
  startWeek: number
  nextMonthStartWeek: number
}

export interface CalendarContextType {
  value: DateFormat
  weekStart: 0 | 1
  locale: Intl.LocalesArgument
  minDate?: Date
  maxDate?: Date

  onMonthChange: (amount: number) => void
  onYearChange: (amount: number) => void
  selectedValue: Array<Date | null>
  handleDayClick: (date: Date) => void
}

const contextScopeName = "calendar"

const [CalendarProvider, useCalendarContext] =
  Context.createContext<CalendarContextType>(contextScopeName)

type RangeDate = [Date | null, Date | null]

interface CalendarBaseProps extends ComponentPropsWithoutRef<"div"> {
  children?: ReactNode
  weekStart?: 0 | 1
  locale?: Intl.LocalesArgument
}

interface CalendarViewProps {
  viewDate?: Date
  defaultViewDate?: Date
  onViewDateChange?: (date: Date) => void
  minDate?: Date
  maxDate?: Date
}

export interface CalendarRootProps
  extends CalendarBaseProps, CalendarViewProps {
  type: "single"

  date?: Date | null
  defaultDate?: Date | null
  onDateChange?: (date: Date | null) => void
}

export interface CalendarRangeProps
  extends CalendarBaseProps, CalendarViewProps {
  type: "range"
  range?: RangeDate
  defaultRange?: RangeDate
  onRangeChange?: (range: RangeDate) => void
}

export const Root = (props: CalendarRootProps | CalendarRangeProps) => {
  const { type = "single", ...rest } = props
  const singleProps = rest as CalendarRootProps
  const rangeProps = rest as CalendarRangeProps
  if (type === "single") {
    return <SingleCalendar {...singleProps} type="single" />
  }
  return <RangeCalendar {...rangeProps} type="range" />
}

export const RangeCalendar = forwardRef<HTMLDivElement, CalendarRangeProps>(
  (
    {
      className,
      children,
      range,
      defaultRange,
      onRangeChange,
      viewDate,
      defaultViewDate,
      onViewDateChange,
      minDate,
      maxDate,
      weekStart = 0,
      locale = "en-US",
      ...props
    },
    ref
  ) => {
    const [rangeValue, setRangeValue] = useControllableState<RangeDate>({
      prop: range,
      defaultProp: defaultRange ?? [null, null],
      onChange: onRangeChange,
    })

    const [viewDateValue, setViewDateValue] = useControllableState<Date>({
      prop: viewDate,
      defaultProp: defaultViewDate ?? new Date(),
      onChange: onViewDateChange,
    })

    const onMonthChange = useCallback(
      (amount: number) => {
        const newDate = new Date(viewDateValue)
        newDate.setMonth(newDate.getMonth() + amount)
        setViewDateValue(newDate)
      },
      [viewDateValue, setViewDateValue]
    )

    const onYearChange = useCallback(
      (amount: number) => {
        const newDate = new Date(viewDateValue)
        newDate.setFullYear(newDate.getFullYear() + amount)
        setViewDateValue(newDate)
      },
      [viewDateValue, setViewDateValue]
    )

    const dateFormat = useMemo(() => {
      const currentDate = new Date(viewDateValue)
      const firstDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      )
      const lastDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      )
      const prevMonthLastDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        0
      )
      const nextMonthFirstDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      )

      return {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate(),
        daysInMonth: lastDay.getDate(),
        startWeek: (firstDay.getDay() - weekStart + 7) % 7,
        daysInPrevMonth: prevMonthLastDay.getDate(),
        nextMonthStartWeek: (nextMonthFirstDay.getDay() - weekStart + 7) % 7,
      }
    }, [viewDateValue, weekStart])

    const handleDayClick = useCallback(
      (clickedDate: Date) => {
        const normalizedClickedDate = new Date(clickedDate)
        normalizedClickedDate.setHours(0, 0, 0, 0)
        setRangeValue((prevRange) => {
          const [start, end] = prevRange
          const normalizedStart = start ? new Date(start) : null
          if (normalizedStart) normalizedStart.setHours(0, 0, 0, 0)

          if (!normalizedStart) {
            return [clickedDate, null]
          }

          if (normalizedStart && !end) {
            if (normalizedClickedDate < normalizedStart) {
              return [clickedDate, null]
            }

            return [start, clickedDate]
          }

          if (normalizedStart && end) {
            return [clickedDate, null]
          }

          return prevRange
        })
      },
      [setRangeValue]
    )

    return (
      <CalendarProvider
        value={dateFormat}
        weekStart={weekStart}
        locale={locale}
        minDate={minDate}
        maxDate={maxDate}
        onMonthChange={onMonthChange}
        onYearChange={onYearChange}
        selectedValue={rangeValue}
        handleDayClick={handleDayClick}
      >
        <div ref={ref} className={cn(styles.root(), className)} {...props}>
          {children}
        </div>
      </CalendarProvider>
    )
  }
)

RangeCalendar.displayName = "RangeCalendar"

export const SingleCalendar = forwardRef<HTMLDivElement, CalendarRootProps>(
  (
    {
      className,
      children,
      date,
      defaultDate,
      onDateChange,
      viewDate,
      defaultViewDate,
      onViewDateChange,
      minDate,
      maxDate,
      weekStart = 0,
      locale = "en-US",
      ...props
    },
    ref
  ) => {
    const [dateValue, setDateValue] = useControllableState<Date>({
      prop: viewDate,
      defaultProp: defaultViewDate ?? new Date(),
      onChange: onViewDateChange,
    })

    const [selectedValue, setSelectedValue] = useControllableState<Date | null>(
      {
        prop: date,
        defaultProp: defaultDate ?? null,
        onChange: onDateChange,
      }
    )

    const onMonthChange = useCallback(
      (amount: number) => {
        const newDate = new Date(dateValue)
        newDate.setMonth(newDate.getMonth() + amount)
        setDateValue(newDate)
      },
      [dateValue, setDateValue]
    )

    const onYearChange = useCallback(
      (amount: number) => {
        const newDate = new Date(dateValue)
        newDate.setFullYear(newDate.getFullYear() + amount)
        setDateValue(newDate)
      },
      [dateValue, setDateValue]
    )

    const dateFormat = useMemo(() => {
      const currentDate = new Date(dateValue)
      const firstDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      )
      const lastDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      )
      const prevMonthLastDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        0
      )
      const nextMonthFirstDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      )

      return {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate(),
        daysInMonth: lastDay.getDate(),
        startWeek: (firstDay.getDay() - weekStart + 7) % 7,
        daysInPrevMonth: prevMonthLastDay.getDate(),
        nextMonthStartWeek: (nextMonthFirstDay.getDay() - weekStart + 7) % 7,
      }
    }, [dateValue, weekStart])

    return (
      <CalendarProvider
        value={dateFormat}
        onMonthChange={onMonthChange}
        onYearChange={onYearChange}
        weekStart={weekStart}
        locale={locale}
        minDate={minDate}
        maxDate={maxDate}
        selectedValue={selectedValue ? [selectedValue] : []}
        handleDayClick={(clickedDate: Date) => setSelectedValue(clickedDate)}
      >
        <div ref={ref} className={cn(styles.root(), className)} {...props}>
          {children}
        </div>
      </CalendarProvider>
    )
  }
)

SingleCalendar.displayName = "SingleCalendar"

interface HeaderProps {
  month?: Intl.DateTimeFormatOptions["month"]
  year?: Intl.DateTimeFormatOptions["year"]
  render?: (date: Date, locale: Intl.LocalesArgument) => string
  className?: string
}

export const Header = ({
  className,
  month = "long",
  year = "numeric",
  render,
}: HeaderProps) => {
  const { value, onMonthChange, locale, minDate, maxDate } =
    useCalendarContext(contextScopeName)

  const monthAndYear = new Intl.DateTimeFormat(locale, {
    month,
    year,
  }).format(new Date(value.year, value.month - 1))
  const previousMonthTime = parseMonthTimestamp(
    new Date(value.year, value.month - 2, 1)
  )
  const nextMonthTime = parseMonthTimestamp(
    new Date(value.year, value.month, 1)
  )
  const minMonthTime = minDate ? parseMonthTimestamp(minDate) : undefined
  const maxMonthTime = maxDate ? parseMonthTimestamp(maxDate) : undefined
  const isPreviousMonthDisabled =
    minMonthTime !== undefined && previousMonthTime < minMonthTime
  const isNextMonthDisabled =
    maxMonthTime !== undefined && nextMonthTime > maxMonthTime

  return (
    <div className={cn(styles.header(), className)}>
      <button
        className={styles.navButton()}
        onClick={() => onMonthChange(-1)}
        disabled={isPreviousMonthDisabled}
        aria-label="Go To Previous month"
      >
        <ChevronLeft />
      </button>
      <div className={styles.title()}>
        {render
          ? render(new Date(value.year, value.month - 1), locale)
          : `${monthAndYear}`}
      </div>
      <button
        className={styles.navButton()}
        onClick={() => onMonthChange(1)}
        disabled={isNextMonthDisabled}
        aria-label="Go To Next month"
      >
        <ChevronRight />
      </button>
    </div>
  )
}

interface WeekdayProps {
  format?: "short" | "long"
  className?: string
}

export const Weekday = ({ className, format = "short" }: WeekdayProps) => {
  const { weekStart, locale } = useCalendarContext(contextScopeName)

  return (
    <div className={cn(styles.weekday(), className)}>
      {getWeekdays(weekStart, locale, format).map((day, index) => (
        <div key={index}>{day}</div>
      ))}
    </div>
  )
}

interface DaysProps {
  showOutsideDays?: boolean
  disabled?: boolean | ((date: Date) => boolean)
  className?: string
}

interface DayButtonProps extends ComponentPropsWithoutRef<"button"> {
  day: number
  month: number
  year: number
  isHidden: boolean
  isSelected: boolean
  isOutsideMonth: boolean
  className?: string
}

const DayButton = ({
  className,
  day,
  month,
  year,
  isHidden,
  isSelected,
  isOutsideMonth,
  disabled,
  ...props
}: DayButtonProps) => {
  return (
    <button
      className={cn(styles.dayCell(), className)}
      data-day={day}
      data-disabled={disabled ? "" : undefined}
      data-month={month}
      data-selected={isSelected ? "" : undefined}
      data-year={year}
      data-hidden={isHidden}
      data-outside-month={isOutsideMonth}
      aria-hidden={isHidden}
      disabled={disabled}
      {...props}
    >
      {!isHidden && day}
    </button>
  )
}

export const Days = ({
  className,
  disabled,
  showOutsideDays = true,
}: DaysProps) => {
  const { value, handleDayClick, selectedValue, minDate, maxDate } =
    useCalendarContext(contextScopeName)
  const minDateTime = minDate ? parseDateTimestamp(minDate) : undefined
  const maxDateTime = maxDate ? parseDateTimestamp(maxDate) : undefined
  const weeks = useMemo(() => {
    const days: Array<{ day: number; isCurrentMonth: boolean }> = []

    for (let i = value.startWeek; i > 0; i--) {
      days.push({
        day: value.daysInPrevMonth - i + 1,
        isCurrentMonth: false,
      })
    }

    for (let i = 1; i <= value.daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
      })
    }

    for (let i = 1; i <= 6 - value.nextMonthStartWeek + 1; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
      })
    }

    const weeks = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    return weeks
  }, [
    value.startWeek,
    value.daysInMonth,
    value.daysInPrevMonth,
    value.nextMonthStartWeek,
  ])

  return (
    <table className={cn(styles.daysGrid(), className)}>
      <tbody>
        {weeks.map((week, weekIndex) => (
          <tr key={weekIndex} className={styles.weekRow()}>
            {week.map((day, dayIndex) => {
              const isHidden = !showOutsideDays && !day.isCurrentMonth
              const month = day.isCurrentMonth
                ? value.month
                : weekIndex === 0
                  ? value.month - 1
                  : value.month + 1
              const date = new Date(value.year, month - 1, day.day)
              const dateTime = parseDateTimestamp(date)
              const isDisabled =
                isHidden ||
                (minDateTime !== undefined && dateTime < minDateTime) ||
                (maxDateTime !== undefined && dateTime > maxDateTime) ||
                (typeof disabled === "function" ? disabled(date) : disabled)
              const isSelected = selectedValue.some(
                (selectedDate) =>
                  selectedDate !== null && isSameDay(selectedDate, date)
              )

              return (
                <td key={`${weekIndex}-${dayIndex}`} className="p-0.5">
                  <DayButton
                    day={day.day}
                    disabled={isDisabled}
                    month={month}
                    year={value.year}
                    isHidden={isHidden}
                    isSelected={isSelected}
                    isOutsideMonth={!day.isCurrentMonth}
                    onClick={() => handleDayClick(date)}
                  />
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function isSameDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  )
}

function parseDateTimestamp(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function parseMonthTimestamp(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime()
}

function getWeekdays(
  weekStart: 0 | 1,
  locale: Intl.LocalesArgument,
  format: Intl.DateTimeFormatOptions["weekday"] = "short"
): string[] {
  const dayIndices = [0, 1, 2, 3, 4, 5, 6]

  const orderedDayIndices = [
    ...dayIndices.slice(weekStart),
    ...dayIndices.slice(0, weekStart),
  ]

  return orderedDayIndices.map((dayIndex) => {
    const date = new Date()
    date.setDate(date.getDate() - date.getDay() + dayIndex)

    return new Intl.DateTimeFormat(locale, { weekday: format }).format(date)
  })
}
