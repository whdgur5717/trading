"use client"

import * as Calendar from "@/components/calendar"
import { createPickerField } from "@/components/picker-field"
import { ChevronDown } from "lucide-react"
import type { ComponentProps } from "react"
import { useState } from "react"
import { TradingCalendar } from "./tradingCalendar"

export type PurchaseDateShortcut = {
  label: string
  value: NonNullable<Calendar.CalendarRootProps["date"]>
}

type PurchaseDatePickerProps = {
  value?: NonNullable<Calendar.CalendarRootProps["date"]>
  shortcuts?: readonly PurchaseDateShortcut[]
  disabled?: ComponentProps<typeof Calendar.Days>["disabled"]
  onChange: (date: NonNullable<Calendar.CalendarRootProps["date"]>) => void
}

const Picker =
  createPickerField<NonNullable<Calendar.CalendarRootProps["date"]>>(
    "PurchaseDatePicker"
  )

function formatPurchaseDate(date: Date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`
}

function isSameDate(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  )
}

export function PurchaseDatePicker({
  value,
  shortcuts = [],
  disabled,
  onChange,
}: PurchaseDatePickerProps) {
  const [viewDate, setViewDate] = useState(() => value ?? new Date())

  return (
    <Picker.Root
      value={value}
      onValueChange={(date) => {
        if (!date) return

        setViewDate(date)
        onChange(date)
      }}
    >
      <div className="relative">
        <Picker.Trigger asChild>
          {({ value: selectedDate }) => {
            return (
              <button type="button">
                <span className="col-span-full type-label text-muted">
                  날짜
                </span>
                {selectedDate ? (
                  <>
                    <strong className="min-w-0 truncate type-title text-ink">
                      {formatPurchaseDate(selectedDate)}
                    </strong>
                    <small className="flex items-end gap-2 pb-0.5 text-label font-bold text-muted">
                      거래일 기준
                      <ChevronDown className="size-4 shrink-0 transition-transform duration-150 ease-standard group-data-[state=open]:rotate-180" />
                    </small>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 truncate type-body text-subtle">
                      날짜 선택
                    </span>
                    <small className="flex items-end gap-2 pb-0.5 text-label font-medium text-subtle">
                      거래일 기준
                      <ChevronDown className="size-4 shrink-0 transition-transform duration-150 ease-standard group-data-[state=open]:rotate-180" />
                    </small>
                  </>
                )}
              </button>
            )
          }}
        </Picker.Trigger>

        <Picker.Content align="start" asChild sideOffset={8}>
          <div className="space-y-3">
            {shortcuts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {shortcuts.map((shortcut) => (
                  <Picker.Item
                    asChild
                    className="w-auto justify-center rounded-lg bg-surface-muted px-3 py-2 type-label text-muted hover:bg-primary hover:text-primary-foreground data-selected:bg-primary data-selected:text-primary-foreground"
                    disabled={
                      typeof disabled === "function"
                        ? disabled(shortcut.value)
                        : disabled
                    }
                    isSelected={(currentValue, itemValue) =>
                      currentValue !== undefined &&
                      isSameDate(currentValue, itemValue)
                    }
                    key={shortcut.label}
                    value={shortcut.value}
                  >
                    <button>{shortcut.label}</button>
                  </Picker.Item>
                ))}
              </div>
            )}

            <div className="rounded-xl bg-surface-muted/60 p-3">
              <Picker.Value>
                {(picker) => (
                  <TradingCalendar
                    selectedDate={picker.value}
                    viewDate={viewDate}
                    onSelectDate={picker.select}
                    onViewDateChange={setViewDate}
                  />
                )}
              </Picker.Value>
            </div>
          </div>
        </Picker.Content>
      </div>
    </Picker.Root>
  )
}
