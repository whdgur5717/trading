import { http, HttpResponse } from "msw"
import { setupServer } from "msw/node"
import {
  KIS_CURRENT_PRICE_PATH,
  KIS_DAILY_ITEM_CHART_PRICE_PATH,
  KIS_DOMESTIC_HOLIDAY_PATH,
} from "../../../src/kis/kis.constants"
import {
  approvalKeyResponse,
  currentPriceResponse,
  dailyPriceResponse,
  tokenResponse,
} from "./samples"
import { env } from "../../env"

export const server = setupServer(
  http.post(`${env.KIS_REST_BASE_URL}/oauth2/Approval`, () =>
    HttpResponse.json(approvalKeyResponse)
  ),
  http.post(`${env.KIS_REST_BASE_URL}/oauth2/tokenP`, () =>
    HttpResponse.json(tokenResponse)
  ),
  http.get(`${env.KIS_REST_BASE_URL}${KIS_CURRENT_PRICE_PATH}`, () =>
    HttpResponse.json(currentPriceResponse)
  ),
  http.get(`${env.KIS_REST_BASE_URL}${KIS_DAILY_ITEM_CHART_PRICE_PATH}`, () =>
    HttpResponse.json(dailyPriceResponse)
  ),
  http.get(
    `${env.KIS_REST_BASE_URL}${KIS_DOMESTIC_HOLIDAY_PATH}`,
    ({ request }) => {
      const date =
        new URL(request.url).searchParams.get("BASS_DT") ?? "20260604"

      return HttpResponse.json({
        rt_cd: "0",
        msg_cd: "MCA00000",
        msg1: "ok",
        output: [
          {
            bass_dt: date,
            bzdy_yn: "Y",
            tr_day_yn: "Y",
            opnd_yn: "Y",
            sttl_day_yn: "Y",
          },
        ],
      })
    }
  ),
  http.all(`${env.KIS_REST_BASE_URL}/*`, ({ request }) => {
    throw new Error(`Unhandled KIS request: ${request.method} ${request.url}`)
  })
)
