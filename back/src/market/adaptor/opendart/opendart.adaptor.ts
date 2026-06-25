import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { err, ok, type Result } from "neverthrow"
import {
  HttpRequestProvider,
  type HttpResponse,
} from "../../../common/http/httpRequest.provider"
import {
  MARKET_DATA_ERRORS,
  type MarketDataError,
} from "../../market-data.error"
import type {
  CompanyProfile,
  DisclosureQuery,
  FinancialAccount,
  FinancialAccountsQuery,
  MarketDisclosure,
} from "../../market.schema"
import { stockSymbolSchema } from "../../port/data"
import corpCodesJson from "./data/corp-codes.json"
import { type OpendartFailure, toOpendartMarketError } from "./opendart.error"
import { OPENDART_BASE_URL, opendartRest } from "./opendart.protocol"
import {
  dataFromOpendartResponse,
  opendartRequestFailure,
  parseOpendartListResponse,
  parseRequiredOpendartResponse,
} from "./opendart.response"
import {
  companyResponseSchema,
  corpCodeMapSchema,
  disclosureListResponseSchema,
  financialAccountsResponseSchema,
} from "./opendart.schema"

const corpCodeMap = new Map(
  Object.entries(corpCodeMapSchema.parse(corpCodesJson))
)

@Injectable()
export class OpendartAdaptor {
  constructor(
    private readonly httpRequestProvider: HttpRequestProvider,
    private readonly config: ConfigService
  ) {}

  corpCode(stockCode: string): Result<string, MarketDataError> {
    const parsedStockCode = stockSymbolSchema.safeParse(stockCode)

    if (!parsedStockCode.success) {
      return err({
        type: "market-data-not-found",
        message: MARKET_DATA_ERRORS["market-data-not-found"].message,
        details: { service: "opendart", stockCode },
      })
    }

    const corpCode = corpCodeMap.get(parsedStockCode.data)

    if (!corpCode) {
      return err({
        type: "market-data-not-found",
        message: MARKET_DATA_ERRORS["market-data-not-found"].message,
        details: { service: "opendart", stockCode: parsedStockCode.data },
      })
    }

    return ok(corpCode)
  }

  async company(
    corpCode: string
  ): Promise<Result<CompanyProfile, MarketDataError>> {
    const data = await this.get(opendartRest.company, { corp_code: corpCode })

    if (data.isErr()) {
      return err(toOpendartMarketError(data.error))
    }

    return parseRequiredOpendartResponse(
      opendartRest.company,
      data.value,
      companyResponseSchema
    ).mapErr(toOpendartMarketError)
  }

  async disclosures(
    query: DisclosureQuery
  ): Promise<Result<MarketDisclosure[], MarketDataError>> {
    const data = await this.get(opendartRest.disclosures, {
      corp_code: query.corpCode,
      bgn_de: query.beginDate,
      end_de: query.endDate,
      last_reprt_at: "Y",
      page_no: "1",
      page_count: "100",
    })

    if (data.isErr()) {
      return err(toOpendartMarketError(data.error))
    }

    return parseOpendartListResponse(
      opendartRest.disclosures,
      data.value,
      disclosureListResponseSchema
    )
      .mapErr(toOpendartMarketError)
      .map((response) => response.list)
  }

  async financialAccounts(
    query: FinancialAccountsQuery
  ): Promise<Result<FinancialAccount[], MarketDataError>> {
    const data = await this.get(opendartRest.financialAccounts, {
      corp_code: query.corpCode,
      bsns_year: query.businessYear,
      reprt_code: query.reportCode,
    })

    if (data.isErr()) {
      return err(toOpendartMarketError(data.error))
    }

    return parseOpendartListResponse(
      opendartRest.financialAccounts,
      data.value,
      financialAccountsResponseSchema
    )
      .mapErr(toOpendartMarketError)
      .map((response) => response.list)
  }

  private async get(
    path: string,
    query: Record<string, string>
  ): Promise<Result<unknown, OpendartFailure>> {
    let response: HttpResponse

    try {
      response = await this.httpRequestProvider.request({
        method: "GET",
        url: `${OPENDART_BASE_URL}${path}`,
        query: {
          crtfc_key: this.apiKey,
          ...query,
        },
      })
    } catch (error) {
      return err(opendartRequestFailure(path, error))
    }

    return dataFromOpendartResponse(response, path)
  }

  private get apiKey(): string {
    return this.config.getOrThrow<string>("DART_API_KEY")
  }
}
