import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { err, ok, type Result } from "neverthrow"
import type { z } from "zod"
import {
  HttpRequestError,
  HttpRequestProvider,
  type HttpResponse,
} from "../../../common/http/httpRequest.provider"
import { marketErrors, type MarketDataError } from "../../market-data.error"
import type {
  CompanyProfile,
  DisclosureQuery,
  FinancialAccount,
  FinancialAccountsQuery,
  MarketDisclosure,
} from "../../market.schema"
import { stockSymbolSchema } from "../../port/data"
import corpCodesJson from "./data/corp-codes.json"
import {
  OPENDART_BASE_URL,
  OPENDART_NO_DATA_STATUS,
  opendartRest,
} from "./opendart.protocol"
import {
  companyResponseSchema,
  corpCodeMapSchema,
  disclosureListResponseSchema,
  financialAccountsResponseSchema,
  opendartAuthFailureResponseSchema,
  opendartFailureResponseSchema,
  opendartNoDataResponseSchema,
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
      return err(
        marketErrors.dataNotFound({
          provider: "opendart",
          endpoint: "corp-code-map",
          upstreamStatus: null,
          upstreamCode: null,
        })
      )
    }

    const corpCode = corpCodeMap.get(parsedStockCode.data)

    if (!corpCode) {
      return err(
        marketErrors.dataNotFound({
          provider: "opendart",
          endpoint: "corp-code-map",
          upstreamStatus: null,
          upstreamCode: null,
        })
      )
    }

    return ok(corpCode)
  }

  async company(
    corpCode: string
  ): Promise<Result<CompanyProfile, MarketDataError>> {
    const response = await this.get(opendartRest.company, {
      corp_code: corpCode,
    })

    if (response.isErr()) {
      return err(response.error)
    }

    const company = this.parseBody(
      response.value,
      opendartRest.company,
      companyResponseSchema
    )

    if (company.isErr()) {
      return err(company.error)
    }

    if (company.value === null) {
      return err(
        marketErrors.dataNotFound({
          provider: "opendart",
          endpoint: opendartRest.company,
          upstreamStatus: response.value.status,
          upstreamCode: OPENDART_NO_DATA_STATUS,
        })
      )
    }

    return ok(company.value)
  }

  async disclosures(
    query: DisclosureQuery
  ): Promise<Result<MarketDisclosure[], MarketDataError>> {
    const response = await this.get(opendartRest.disclosures, {
      corp_code: query.corpCode,
      bgn_de: query.beginDate,
      end_de: query.endDate,
      last_reprt_at: "Y",
      page_no: "1",
      page_count: "100",
    })

    if (response.isErr()) {
      return err(response.error)
    }

    const disclosures = this.parseBody(
      response.value,
      opendartRest.disclosures,
      disclosureListResponseSchema
    )

    if (disclosures.isErr()) {
      return err(disclosures.error)
    }

    if (disclosures.value === null) {
      return ok([])
    }

    return ok(disclosures.value)
  }

  async financialAccounts(
    query: FinancialAccountsQuery
  ): Promise<Result<FinancialAccount[], MarketDataError>> {
    const response = await this.get(opendartRest.financialAccounts, {
      corp_code: query.corpCode,
      bsns_year: query.businessYear,
      reprt_code: query.reportCode,
    })

    if (response.isErr()) {
      return err(response.error)
    }

    const accounts = this.parseBody(
      response.value,
      opendartRest.financialAccounts,
      financialAccountsResponseSchema
    )

    if (accounts.isErr()) {
      return err(accounts.error)
    }

    if (accounts.value === null) {
      return ok([])
    }

    return ok(accounts.value)
  }

  private parseBody<TSchema extends z.ZodType>(
    response: HttpResponse,
    endpoint: string,
    schema: TSchema
  ): Result<z.output<TSchema> | null, MarketDataError> {
    const success = schema.safeParse(response.data)

    if (success.success) {
      return ok(success.data)
    }

    const noData = opendartNoDataResponseSchema.safeParse(response.data)

    if (noData.success) {
      return ok(null)
    }

    const authFailure = opendartAuthFailureResponseSchema.safeParse(
      response.data
    )

    if (authFailure.success) {
      return err(
        marketErrors.providerAuthUnavailable({
          provider: "opendart",
          endpoint,
          upstreamStatus: response.status,
          upstreamCode: authFailure.data.status,
        })
      )
    }

    const failure = opendartFailureResponseSchema.safeParse(response.data)

    if (failure.success) {
      return err(
        marketErrors.providerUnavailable({
          provider: "opendart",
          endpoint,
          upstreamStatus: response.status,
          upstreamCode: failure.data.status,
        })
      )
    }

    return err(
      marketErrors.providerInvalidResponse({
        provider: "opendart",
        endpoint,
        upstreamStatus: response.status,
        upstreamCode: null,
      })
    )
  }

  private async get(
    path: string,
    query: Record<string, string>
  ): Promise<Result<HttpResponse, MarketDataError>> {
    let response: HttpResponse

    try {
      response = await this.httpRequestProvider.request({
        method: "GET",
        url: `${OPENDART_BASE_URL}${path}`,
        query: {
          crtfc_key: this.apiKey,
          ...query,
        },
        validateStatus: (status) => status >= 200 && status < 300,
      })
    } catch (error) {
      if (!(error instanceof HttpRequestError)) {
        throw error
      }

      const upstreamStatus = error.response?.status ?? null
      const upstreamCode = error.code ?? null

      if (upstreamStatus === 401 || upstreamStatus === 403) {
        return err(
          marketErrors.providerAuthUnavailable({
            provider: "opendart",
            endpoint: path,
            upstreamStatus,
            upstreamCode,
          })
        )
      }

      if (error.kind === "timeout") {
        return err(
          marketErrors.providerTimeout({
            provider: "opendart",
            endpoint: path,
            upstreamStatus,
            upstreamCode,
          })
        )
      }

      return err(
        marketErrors.providerUnavailable({
          provider: "opendart",
          endpoint: path,
          upstreamStatus,
          upstreamCode,
        })
      )
    }

    return ok(response)
  }

  private get apiKey(): string {
    return this.config.getOrThrow<string>("DART_API_KEY")
  }
}
