import { z } from "zod"
import {
  companyProfileSchema,
  financialAccountSchema,
  marketDisclosureSchema,
} from "../../market.schema"
import { stockSymbolSchema } from "../../port/data"
import {
  OPENDART_AUTH_FAILURE_STATUS,
  OPENDART_NO_DATA_STATUS,
  OPENDART_SUCCESS_STATUS,
} from "./opendart.protocol"

export const opendartCorpCodeSchema = z.string().regex(/^\d{8}$/)

export const corpCodeMapSchema = z.record(
  stockSymbolSchema,
  opendartCorpCodeSchema
)

const opendartSuccessStatusSchema = z.object({
  status: z.literal(OPENDART_SUCCESS_STATUS),
  message: z.string().optional(),
})

export const opendartNoDataResponseSchema = z.object({
  status: z.literal(OPENDART_NO_DATA_STATUS),
  message: z.string().optional(),
})

export const opendartAuthFailureResponseSchema = z.object({
  status: z.enum(OPENDART_AUTH_FAILURE_STATUS),
  message: z.string().optional(),
})

export const opendartFailureResponseSchema = z.object({
  status: z.string().min(1),
  message: z.string().optional(),
})

const nullableTextSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined) {
      return null
    }

    const normalized = value.trim()
    return normalized === "" ? null : normalized
  })

const nullableStockCodeSchema = nullableTextSchema.pipe(
  stockSymbolSchema.nullable()
)

const amountSchema = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined) {
      return null
    }

    const normalized = String(value).replaceAll(",", "").trim()
    return normalized === "" || normalized === "-" ? null : normalized
  })
  .transform((value) => (value === null ? null : Number(value)))
  .pipe(z.number().nullable())

const companyResponseRowSchema = z
  .object({
    corp_code: opendartCorpCodeSchema,
    corp_name: z.string().min(1),
    stock_code: nullableStockCodeSchema,
    stock_name: nullableTextSchema,
    corp_cls: z.string().min(1),
    induty_code: nullableTextSchema,
    est_dt: nullableTextSchema,
    acc_mt: nullableTextSchema,
  })
  .transform((row) => ({
    corpCode: row.corp_code,
    corpName: row.corp_name,
    stockCode: row.stock_code,
    stockName: row.stock_name,
    corpClass: row.corp_cls,
    industryCode: row.induty_code,
    establishedDate: row.est_dt,
    settlementMonth: row.acc_mt,
  }))
  .pipe(companyProfileSchema)

const disclosureRowSchema = z
  .object({
    rcept_no: z.string().min(1),
    corp_code: opendartCorpCodeSchema,
    stock_code: nullableStockCodeSchema,
    corp_name: z.string().min(1),
    report_nm: z.string().min(1),
    flr_nm: z.string().min(1),
    rcept_dt: z.string().regex(/^\d{8}$/),
    rm: z.string().optional().default(""),
  })
  .transform((row) => ({
    receiptNo: row.rcept_no,
    corpCode: row.corp_code,
    stockCode: row.stock_code,
    corpName: row.corp_name,
    reportName: row.report_nm,
    filerName: row.flr_nm,
    receiptDate: row.rcept_dt,
    remark: row.rm,
  }))
  .pipe(marketDisclosureSchema)

const financialAccountRowSchema = z
  .object({
    bsns_year: z.string().regex(/^\d{4}$/),
    reprt_code: z.enum(["11013", "11012", "11014", "11011"]),
    corp_code: opendartCorpCodeSchema,
    sj_div: z.string().min(1),
    account_id: nullableTextSchema,
    account_nm: z.string().min(1),
    thstrm_amount: amountSchema,
    frmtrm_amount: amountSchema,
    bfefrmtrm_amount: amountSchema,
    currency: nullableTextSchema,
  })
  .transform((row) => ({
    businessYear: row.bsns_year,
    reportCode: row.reprt_code,
    corpCode: row.corp_code,
    statementDivision: row.sj_div,
    accountId: row.account_id,
    accountName: row.account_nm,
    currentAmount: row.thstrm_amount,
    previousAmount: row.frmtrm_amount,
    beforePreviousAmount: row.bfefrmtrm_amount,
    currency: row.currency,
  }))
  .pipe(financialAccountSchema)

function singleOrManyArraySchema<TSchema extends z.ZodType>(
  itemSchema: TSchema
) {
  return z
    .union([z.array(itemSchema), itemSchema, z.undefined()])
    .transform((item) => {
      if (!item) {
        return []
      }

      return Array.isArray(item) ? item : [item]
    })
}

export const companyResponseSchema = opendartSuccessStatusSchema
  .and(companyResponseRowSchema)
  .transform((row) => ({
    corpCode: row.corpCode,
    corpName: row.corpName,
    stockCode: row.stockCode,
    stockName: row.stockName,
    corpClass: row.corpClass,
    industryCode: row.industryCode,
    establishedDate: row.establishedDate,
    settlementMonth: row.settlementMonth,
  }))
  .pipe(companyProfileSchema)

export const disclosureListResponseSchema = opendartSuccessStatusSchema
  .and(
    z.object({
      list: singleOrManyArraySchema(disclosureRowSchema),
    })
  )
  .transform(({ list }) => list)

export const financialAccountsResponseSchema = opendartSuccessStatusSchema
  .and(
    z.object({
      list: singleOrManyArraySchema(financialAccountRowSchema),
    })
  )
  .transform(({ list }) => list)
