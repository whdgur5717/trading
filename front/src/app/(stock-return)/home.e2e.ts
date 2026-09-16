import { expect, test } from "next/experimental/testmode/playwright"

test("서버 오류가 발생하면 다시 시도할 수 있다", async ({ page, next }) => {
  next.onFetch((request) => {
    if (new URL(request.url).pathname !== "/api/returns/chart") return

    return Response.json(
      {
        success: false,
        error: {
          status: 502,
          type: "market.provider_unavailable",
          message: "Market data provider is unavailable",
          data: {
            provider: "kis",
            endpoint:
              "/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice",
            upstreamStatus: 502,
            upstreamCode: null,
          },
        },
      },
      { status: 502 }
    )
  })

  await page.goto("/")

  const stock = page.getByRole("combobox", { name: "종목" })
  await stock.fill("삼성전자")
  await page
    .getByRole("option")
    .filter({ hasText: "삼성전자" })
    .filter({ hasText: "005930" })
    .click()

  await page.getByRole("button", { name: /날짜 선택/ }).click()
  await page.getByRole("combobox", { name: "표시 연도" }).click()
  await page.getByRole("option", { name: "2024년", exact: true }).click()
  await page.getByRole("combobox", { name: "표시 월" }).click()
  await page.getByRole("option", { name: "6월", exact: true }).click()
  await page
    .locator('button[data-year="2024"][data-month="6"][data-day="3"]')
    .click()

  await page.getByRole("spinbutton", { name: "수량" }).fill("10")
  await page.getByRole("button", { name: "계산하기", exact: true }).click()

  const error = page.getByRole("region", { name: "결과 오류" })

  await expect(error).toBeVisible()
  await expect(
    error.getByRole("button", { name: "다시 시도하기", exact: true })
  ).toBeVisible()
  await expect(
    error.getByRole("link", { name: "처음으로 돌아가기", exact: true })
  ).toHaveAttribute("href", "/")
})
