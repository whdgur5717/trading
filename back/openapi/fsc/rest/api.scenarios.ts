// Generated from OpenAPI Overlay examples. Do not edit.
import type {
  FscStockPriceResponse,
  FscErrorResponse,
  FscMarketIndexResponse,
} from "./api"

export const scenarios = {
  fscStockPriceInfo: {
    method: "get",
    path: "/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo",
    scenarios: {
      success: {
        status: 200,
        body: {
          response: {
            header: {
              resultCode: "00",
              resultMsg: "NORMAL SERVICE.",
            },
            body: {
              items: {
                item: [
                  {
                    basDt: "20240614",
                    srtnCd: "005930",
                    isinCd: "KR7005930003",
                    itmsNm: "삼성전자",
                    mrktCtg: "KOSPI",
                    clpr: "75,000",
                    fltRt: "-0.24",
                    mkp: "75,100",
                    hipr: "76,000",
                    lopr: "74,500",
                    trqu: "12,345,678",
                    trPrc: "925,925,850,000",
                    lstgStCnt: "5,969,782,550",
                    mrktTotAmt: "447,733,691,250,000",
                  },
                  {
                    basDt: "20240614",
                    srtnCd: "000660",
                    isinCd: "KR7000660001",
                    itmsNm: "SK하이닉스",
                    mrktCtg: "KOSPI",
                    clpr: "180,000",
                    fltRt: "0.15",
                    mkp: "179,000",
                    hipr: "183,000",
                    lopr: "177,500",
                    trqu: "4,500,000",
                    trPrc: "810,000,000,000",
                    lstgStCnt: "728,002,365",
                    mrktTotAmt: "131,040,425,700,000",
                  },
                  {
                    basDt: "20240614",
                    srtnCd: "005380",
                    isinCd: "KR7005380001",
                    itmsNm: "현대차",
                    mrktCtg: "KOSPI",
                    clpr: "240,000",
                    fltRt: "-0.31",
                    mkp: "241,000",
                    hipr: "244,000",
                    lopr: "238,000",
                    trqu: "1,100,000",
                    trPrc: "264,000,000,000",
                    lstgStCnt: "211,531,506",
                    mrktTotAmt: "50,767,561,440,000",
                  },
                ],
              },
            },
          },
        } satisfies FscStockPriceResponse,
      },
      "error/invalid-request": {
        status: 200,
        body: {
          response: {
            header: {
              resultCode: "03",
              resultMsg: "INVALID REQUEST PARAMETER ERROR.",
            },
          },
        } satisfies FscErrorResponse,
      },
    },
    default: {
      body: {
        response: {
          header: {
            resultCode: "99",
            resultMsg: "UNSUPPORTED FSC REQUEST.",
          },
        },
      } satisfies FscErrorResponse,
    },
  },
  fscMarketIndexInfo: {
    method: "get",
    path: "/1160100/service/GetMarketIndexInfoService/getStockMarketIndex",
    scenarios: {
      success: {
        status: 200,
        body: {
          response: {
            header: {
              resultCode: "00",
              resultMsg: "NORMAL SERVICE.",
            },
            body: {
              items: {
                item: [
                  {
                    basDt: "20240614",
                    idxNm: "코스피",
                    clpr: "2,758.42",
                    fltRt: "0.13",
                    trPrc: "9,012,345,678,901",
                    lstgMrktTotAmt: "2,199,000,000,000,000",
                  },
                  {
                    basDt: "20240614",
                    idxNm: "코스닥",
                    clpr: "862.19",
                    fltRt: "-0.08",
                    trPrc: "6,123,456,789,012",
                    lstgMrktTotAmt: "431,000,000,000,000",
                  },
                ],
              },
            },
          },
        } satisfies FscMarketIndexResponse,
      },
      "error/invalid-request": {
        status: 200,
        body: {
          response: {
            header: {
              resultCode: "03",
              resultMsg: "INVALID REQUEST PARAMETER ERROR.",
            },
          },
        } satisfies FscErrorResponse,
      },
    },
    default: {
      body: {
        response: {
          header: {
            resultCode: "99",
            resultMsg: "UNSUPPORTED FSC REQUEST.",
          },
        },
      } satisfies FscErrorResponse,
    },
  },
} as const
