import { http, HttpResponse } from "msw"
import {
  OPENDART_BASE_URL,
  opendartRest,
} from "../../../../src/market/adaptor/opendart/opendart.protocol"
import companyOk from "./responses/company/200/000.json"
import financialAccountsOk from "./responses/fnlttSinglAcnt/200/000.json"
import listOk from "./responses/list/200/000.json"
import unsupported from "./responses/unsupported/200/100.json"

export function opendartHandlers() {
  return [
    http.get(`${OPENDART_BASE_URL}${opendartRest.company}`, () => {
      return HttpResponse.json(companyOk)
    }),
    http.get(`${OPENDART_BASE_URL}${opendartRest.disclosures}`, () => {
      return HttpResponse.json(listOk)
    }),
    http.get(`${OPENDART_BASE_URL}${opendartRest.financialAccounts}`, () => {
      return HttpResponse.json(financialAccountsOk)
    }),
    http.all(`${OPENDART_BASE_URL}/*`, () => {
      return HttpResponse.json(unsupported)
    }),
  ]
}
