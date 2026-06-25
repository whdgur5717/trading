import { http, HttpResponse } from "msw"
import { rest } from "../../../../src/market/adaptor/kis/protocol"
import approvalKeyResponse from "./responses/oauth2/Approval/200.json"
import tokenResponse from "./responses/oauth2/tokenP/200.json"
import candlesResponse from "./responses/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice/200/MCA00000.json"
import marketDayResponse from "./responses/uapi/domestic-stock/v1/quotations/chk-holiday/200/MCA00000.json"
import priceResponse from "./responses/uapi/domestic-stock/v1/quotations/inquire-price/200/MCA00000.json"
import unsupportedResponse from "./responses/unsupported/200/KIS999.json"

interface KisHandlerOptions {
  readonly restBaseUrl: string
}

export function kisHandlers({ restBaseUrl }: KisHandlerOptions) {
  return [
    http.post(`${restBaseUrl}/oauth2/Approval`, () =>
      HttpResponse.json(approvalKeyResponse)
    ),
    http.post(`${restBaseUrl}/oauth2/tokenP`, () =>
      HttpResponse.json(tokenResponse)
    ),
    http.get(`${restBaseUrl}${rest.price.path}`, () =>
      HttpResponse.json(priceResponse)
    ),
    http.get(`${restBaseUrl}${rest.candles.path}`, () =>
      HttpResponse.json(candlesResponse)
    ),
    http.get(`${restBaseUrl}${rest.marketDay.path}`, ({ request }) => {
      const date =
        new URL(request.url).searchParams.get("BASS_DT") ?? "20260604"

      return HttpResponse.json({
        ...marketDayResponse,
        output: marketDayResponse.output.map((day) => ({
          ...day,
          bass_dt: date,
        })),
      })
    }),
    http.all(`${restBaseUrl}/*`, ({ request }) => {
      return HttpResponse.json({
        ...unsupportedResponse,
        msg1: `${unsupportedResponse.msg1}: ${request.method}`,
      })
    }),
  ]
}
