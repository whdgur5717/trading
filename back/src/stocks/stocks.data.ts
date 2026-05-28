import stocks from "./data/stocks.json"
import { stockSchema, type Stock } from "./stock.schema"
import { z } from "zod"

export const STOCK_MASTER_DATA = "STOCK_MASTER_DATA"
export const stockMasterData: Stock[] = z.array(stockSchema).parse(stocks)
