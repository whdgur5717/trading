// Generated from OpenAPI Overlay examples. Do not edit.
import type {
  OpendartCompanyResponse,
  OpendartErrorResponse,
  OpendartDisclosuresResponse,
  OpendartFinancialAccountsResponse,
} from "./api"

export const scenarios = {
  opendartCompany: {
    method: "get",
    path: "/api/company.json",
    scenarios: {
      success: {
        status: 200,
        body: {
          status: "000",
          message: "정상",
          corp_code: "00126380",
          corp_name: "삼성전자",
          stock_code: "005930",
          stock_name: "삼성전자",
          corp_cls: "Y",
          induty_code: "264",
          est_dt: "19690113",
          acc_mt: "12",
        } satisfies OpendartCompanyResponse,
      },
      "error/no-data": {
        status: 200,
        body: {
          status: "013",
          message: "조회된 데이타가 없습니다.",
        } satisfies OpendartErrorResponse,
      },
      "error/auth": {
        status: 200,
        body: {
          status: "010",
          message: "등록되지 않은 키입니다.",
        } satisfies OpendartErrorResponse,
      },
      "error/invalid-request": {
        status: 200,
        body: {
          status: "100",
          message: "필드의 부적절한 값입니다.",
        } satisfies OpendartErrorResponse,
      },
    },
    default: {
      body: {
        status: "100",
        message: "필드의 부적절한 값입니다.",
      } satisfies OpendartErrorResponse,
    },
  },
  opendartDisclosures: {
    method: "get",
    path: "/api/list.json",
    scenarios: {
      success: {
        status: 200,
        body: {
          status: "000",
          message: "정상",
          list: [
            {
              rcept_no: "2024061400000001",
              corp_code: "00126380",
              stock_code: "005930",
              corp_name: "삼성전자",
              report_nm: "사업보고서",
              flr_nm: "삼성전자",
              rcept_dt: "20240614",
              rm: "",
            },
          ],
        } satisfies OpendartDisclosuresResponse,
      },
      "error/no-data": {
        status: 200,
        body: {
          status: "013",
          message: "조회된 데이타가 없습니다.",
        } satisfies OpendartErrorResponse,
      },
      "error/auth": {
        status: 200,
        body: {
          status: "010",
          message: "등록되지 않은 키입니다.",
        } satisfies OpendartErrorResponse,
      },
      "error/invalid-request": {
        status: 200,
        body: {
          status: "100",
          message: "필드의 부적절한 값입니다.",
        } satisfies OpendartErrorResponse,
      },
    },
    default: {
      body: {
        status: "100",
        message: "필드의 부적절한 값입니다.",
      } satisfies OpendartErrorResponse,
    },
  },
  opendartFinancialAccounts: {
    method: "get",
    path: "/api/fnlttSinglAcnt.json",
    scenarios: {
      success: {
        status: 200,
        body: {
          status: "000",
          message: "정상",
          list: [
            {
              bsns_year: "2025",
              reprt_code: "11011",
              corp_code: "00126380",
              sj_div: "BS",
              account_id: "ifrs-full_Assets",
              account_nm: "자산총계",
              thstrm_amount: "455,000,000,000,000",
              frmtrm_amount: "455,000,000,000,000",
              bfefrmtrm_amount: "455,000,000,000,000",
              currency: "KRW",
            },
            {
              bsns_year: "2025",
              reprt_code: "11011",
              corp_code: "00126380",
              sj_div: "IS",
              account_id: "dart_OperatingIncomeLoss",
              account_nm: "영업이익",
              thstrm_amount: "67,000,000,000,000",
              frmtrm_amount: "67,000,000,000,000",
              bfefrmtrm_amount: "67,000,000,000,000",
              currency: "KRW",
            },
          ],
        } satisfies OpendartFinancialAccountsResponse,
      },
      "error/no-data": {
        status: 200,
        body: {
          status: "013",
          message: "조회된 데이타가 없습니다.",
        } satisfies OpendartErrorResponse,
      },
      "error/auth": {
        status: 200,
        body: {
          status: "010",
          message: "등록되지 않은 키입니다.",
        } satisfies OpendartErrorResponse,
      },
      "error/invalid-request": {
        status: 200,
        body: {
          status: "100",
          message: "필드의 부적절한 값입니다.",
        } satisfies OpendartErrorResponse,
      },
    },
    default: {
      body: {
        status: "100",
        message: "필드의 부적절한 값입니다.",
      } satisfies OpendartErrorResponse,
    },
  },
} as const
