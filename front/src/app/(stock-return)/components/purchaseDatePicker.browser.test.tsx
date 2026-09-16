import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, render } from "vitest-browser-react"

import { PurchaseDatePicker } from "./purchaseDatePicker"

describe("PurchaseDatePicker", () => {
  afterEach(async () => {
    await cleanup()
  })

  it("날짜 선택기를 열면 선택한 날짜에 포커스한다", async () => {
    const screen = await render(
      <PurchaseDatePicker value={new Date(2024, 5, 17)} onChange={vi.fn()} />
    )

    await screen.getByRole("button", { name: /2024\.06\.17/ }).click()

    const selectedDate = screen
      .getByRole("gridcell", { selected: true })
      .getByRole("button")

    await expect.element(selectedDate).toHaveFocus()
  })
})
