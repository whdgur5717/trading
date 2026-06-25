import type { ApplicationError } from "../common/error/error"

export const JOBJU_ERRORS = {
  "jobju-score-unavailable": {
    message: "Jobju score is unavailable",
    description:
      "The service could not collect enough comparable market data to calculate the jobju score.",
  },
  "jobju-unsupported-product": {
    message: "This product is not supported for jobju scoring",
    description:
      "ETF, ETN, preferred stock, REIT, SPAC, and non-stock products are not scored by this endpoint.",
  },
  "jobju-invalid-market": {
    message: "This market is not supported for jobju scoring",
    description:
      "The score currently supports KOSPI and KOSDAQ stocks with comparable market data.",
  },
  "jobju-financial-data-unavailable": {
    message: "Financial disclosure data is unavailable",
    description:
      "The service could not collect the OpenDART financial or disclosure data required for the score.",
  },
} as const

export type JobjuErrorCode = keyof typeof JOBJU_ERRORS
export type JobjuError = ApplicationError<JobjuErrorCode>
