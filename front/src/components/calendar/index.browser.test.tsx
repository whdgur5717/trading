import { userEvent } from "vitest/browser"
import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render } from "vitest-browser-react"

import * as Calendar from "."

describe("Calendar 컴포넌트", () => {
  afterEach(async () => {
    await cleanup()
  })

  it("방향키로 날짜를 탐색한다", async () => {
    const selectedDate = new Date(2024, 5, 17)
    const screen = await render(
      <Calendar.Root date={selectedDate} type="single" viewDate={selectedDate}>
        <Calendar.Days disabled={(date) => date.getDate() === 18} />
      </Calendar.Root>
    )
    const calendar = screen.getByRole("grid", { name: "June 2024" })
    const selectedDay = calendar
      .getByRole("gridcell", { selected: true })
      .getByRole("button")
    const disabledDay = calendar.getByRole("button", {
      name: "Tuesday, June 18, 2024",
    })

    await userEvent.tab()
    await expect.element(selectedDay).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}")

    await expect.element(disabledDay).toHaveFocus()
  })

  it("선택한 날짜가 없으면 Tab 키가 날짜 영역을 건너뛴다", async () => {
    const screen = await render(
      <>
        <Calendar.Root
          date={null}
          type="single"
          viewDate={new Date(2024, 5, 17)}
        >
          <Calendar.Days />
        </Calendar.Root>
        <input aria-label="다음 요소" />
      </>
    )

    await userEvent.tab()

    await expect
      .element(screen.getByRole("textbox", { name: "다음 요소" }))
      .toHaveFocus()
  })
})
