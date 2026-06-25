export const OPENDART_BASE_URL = "https://opendart.fss.or.kr" as const

export const opendartRest = {
  company: "/api/company.json",
  disclosures: "/api/list.json",
  financialAccounts: "/api/fnlttSinglAcnt.json",
  financialAccountsAll: "/api/fnlttSinglAcntAll.json",
} as const

export const OPENDART_SUCCESS_STATUS = "000" as const
export const OPENDART_NO_DATA_STATUS = "013" as const
