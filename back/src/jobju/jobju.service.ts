import { Injectable } from "@nestjs/common"
import { err, type Result } from "neverthrow"
import { StocksService } from "../stocks/stocks.service"
import type { StockError } from "../stocks/stocks.errors"
import type { JobjuError } from "./jobju.errors"
import type { JobjuScore } from "./jobju.schema"
import { POLICY } from "./policy"

@Injectable()
export class JobjuService {
  constructor(private stocksService: StocksService) {}

  score(symbol: string): Result<JobjuScore, StockError | JobjuError> {
    return this.stocksService.getBySymbol(symbol).andThen((stock) => {
      if (stock.marketName !== "KOSPI" && stock.marketName !== "KOSDAQ") {
        const error: JobjuError = {
          type: "jobju-invalid-market",
          message: `Jobju score does not support ${stock.marketName}.`,
        }

        return err(error)
      }

      if (
        stock.productType &&
        POLICY.unsupportedProductTypes.some(
          (productType) => productType === stock.productType
        )
      ) {
        const error: JobjuError = {
          type: "jobju-unsupported-product",
          message: `Jobju score does not support ${stock.productType}.`,
        }

        return err(error)
      }

      const error: JobjuError = {
        type: "jobju-score-unavailable",
        message:
          "Jobju score requires market snapshot and disclosure collection before calculation.",
      }

      return err(error)
    })
  }
}
