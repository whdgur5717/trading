import { http, HttpResponse } from "msw"
import {
  FSC_BASE_URL,
  fscRest,
} from "../../../../src/market/adaptor/fsc/fsc.protocol"
import marketIndexOk from "./responses/getStockMarketIndex/200/00.json"
import stockPriceOk from "./responses/getStockPriceInfo/200/00.json"
import unsupported from "./responses/unsupported/200/99.json"

export function fscHandlers() {
  return [
    http.get(`${FSC_BASE_URL}${fscRest.stockPriceInfo}`, () => {
      return HttpResponse.json(stockPriceOk)
    }),
    http.get(`${FSC_BASE_URL}${fscRest.marketIndexInfo}`, () => {
      return HttpResponse.json(marketIndexOk)
    }),
    http.all(`${FSC_BASE_URL}/*`, () => {
      return HttpResponse.json(unsupported)
    }),
  ]
}
