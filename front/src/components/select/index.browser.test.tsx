import { useState } from "react"
import { page } from "vitest/browser"
import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render } from "vitest-browser-react"

import * as Select from "."

const options = ["첫 번째", "두 번째", "세 번째"]

function DemoSelect({ disabled = false }: { disabled?: boolean }) {
  const [selectedOption, setSelectedOption] = useState<string | null>("두 번째")

  return (
    <Select.Root
      value={selectedOption}
      onValueChange={setSelectedOption}
      disabled={disabled}
    >
      <Select.Trigger
        aria-label="항목 선택"
        className="h-9 w-28 px-3 type-label"
      >
        <Select.Value>{(value) => value}</Select.Value>
        <Select.Icon className="[&_svg]:size-4" />
      </Select.Trigger>
      <Select.Content className="max-h-56 w-28">
        <Select.List>
          {options.map((value) => (
            <Select.Item
              key={value}
              value={value}
              className="min-h-9 px-2.5 py-2 type-label"
            >
              <Select.ItemText>{value}</Select.ItemText>
              <Select.ItemIndicator className="[&_svg]:size-4" />
            </Select.Item>
          ))}
        </Select.List>
      </Select.Content>
    </Select.Root>
  )
}

describe("Select 컴포넌트", () => {
  afterEach(async () => {
    await cleanup()
  })

  it("항목을 선택하면 선택한 항목이 버튼에 표시된다", async () => {
    const screen = await render(<DemoSelect />)
    const selectButton = screen.getByRole("combobox", { name: "항목 선택" })

    await expect.element(selectButton).toHaveTextContent("두 번째")

    await selectButton.click()
    await expect
      .element(page.getByRole("option", { name: "세 번째" }))
      .toBeVisible()

    await page.getByRole("option", { name: "세 번째" }).click()

    await expect.element(selectButton).toHaveTextContent("세 번째")
  })

  it("disabled 상태에서는 선택 버튼이 비활성화된다", async () => {
    const screen = await render(<DemoSelect disabled />)
    const selectButton = screen.getByRole("combobox", { name: "항목 선택" })

    await expect.element(selectButton).toBeDisabled()
  })
})
