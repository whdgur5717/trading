import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server"

export const stockReturnSearchParamsCache = createSearchParamsCache({
  code: parseAsString.withDefault(""),
  buyDate: parseAsString.withDefault(""),
  quantity: parseAsInteger.withDefault(0),
})
