import { z } from "zod"
import {
  OpendartCompanyResponse,
  OpendartCorpCode,
  OpendartDisclosuresResponse,
  OpendartFinancialAccountsResponse,
} from "#generated/opendart/rest/api"
import {
  companyProfileSchema,
  financialAccountSchema,
  marketDisclosureSchema,
} from "../../../schema"
import { stockSymbolSchema } from "../../../schema"

export const OPENDART_SUCCESS_STATUS = "000" as const
export const OPENDART_NO_DATA_STATUS = "013" as const
export const OPENDART_AUTH_FAILURE_STATUS = ["010", "011", "020"] as const

export const corpCodeMapSchema = z.record(stockSymbolSchema, OpendartCorpCode)

function nullableText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null
  }

  const normalized = value.trim()
  return normalized === "" ? null : normalized
}

function amount(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null
  }

  const normalized = String(value).replaceAll(",", "").trim()
  return normalized === "" || normalized === "-" ? null : Number(normalized)
}

export const companyMapper = z
  .pipe(
    OpendartCompanyResponse,
    z.transform((row) => ({
      corpCode: row.corp_code,
      corpName: row.corp_name,
      symbol: nullableText(row.stock_code),
      stockName: nullableText(row.stock_name),
      corpClass: row.corp_cls,
      industryCode: nullableText(row.induty_code),
      establishedDate: nullableText(row.est_dt),
      settlementMonth: nullableText(row.acc_mt),
    }))
  )
  .pipe(companyProfileSchema)

export const disclosureListMapper = z
  .pipe(
    OpendartDisclosuresResponse,
    z.transform(({ list }) =>
      (list ? (Array.isArray(list) ? list : [list]) : []).map((row) => ({
        receiptNo: row.rcept_no,
        corpCode: row.corp_code,
        symbol: nullableText(row.stock_code),
        corpName: row.corp_name,
        reportName: row.report_nm,
        filerName: row.flr_nm,
        receiptDate: row.rcept_dt,
        remark: row.rm,
      }))
    )
  )
  .pipe(z.array(marketDisclosureSchema))

export const financialAccountsMapper = z
  .pipe(
    OpendartFinancialAccountsResponse,
    z.transform(({ list }) =>
      (list ? (Array.isArray(list) ? list : [list]) : []).map((row) => ({
        businessYear: row.bsns_year,
        reportCode: row.reprt_code,
        corpCode: row.corp_code,
        statementDivision: row.sj_div,
        accountId: nullableText(row.account_id),
        accountName: row.account_nm,
        currentAmount: amount(row.thstrm_amount),
        previousAmount: amount(row.frmtrm_amount),
        beforePreviousAmount: amount(row.bfefrmtrm_amount),
        currency: nullableText(row.currency),
      }))
    )
  )
  .pipe(z.array(financialAccountSchema))
