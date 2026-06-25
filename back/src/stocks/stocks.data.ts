import stocks from "./data/stocks.json"
import { stockSourceSchema, type Stock } from "./stock.schema"
import { z } from "zod"

export const STOCK_MASTER_DATA = "STOCK_MASTER_DATA"
export const stockMasterData: Stock[] = z.array(stockSourceSchema).parse(stocks)
