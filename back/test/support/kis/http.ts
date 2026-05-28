import { http, HttpResponse } from "msw"
import { setupServer } from "msw/node"
import {
  KIS_CURRENT_PRICE_PATH,
  KIS_DAILY_ITEM_CHART_PRICE_PATH,
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
  http.all(`${env.KIS_REST_BASE_URL}/*`, ({ request }) => {
    throw new Error(`Unhandled KIS request: ${request.method} ${request.url}`)
  })
)
