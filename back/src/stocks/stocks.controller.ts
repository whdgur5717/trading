import { Controller, Get, Param, Query } from "@nestjs/common"
import { SuggestionDto, SuggestionQueryDto } from "./suggestion/suggestion.dto"
import { SuggestionService } from "./suggestion/suggestion.service"
import {
  StockDto,
  StockSearchQueryDto,
  StockSymbolParamDto,
} from "./stocks.dto"
import { StocksService } from "./stocks.service"

@Controller("stocks")
export class StocksController {
  constructor(
    private readonly stocksService: StocksService,
    private readonly suggestionService: SuggestionService
  ) {}

  @Get("suggestion")
  suggestion(@Query() query: SuggestionQueryDto): SuggestionDto {
    return this.suggestionService.suggest(query.q, query.limit)
  }

  @Get()
  search(@Query() query: StockSearchQueryDto): StockDto[] {
    return this.stocksService.search(query.query)
  }

  @Get(":symbol")
  get(@Param() params: StockSymbolParamDto) {
    return this.stocksService.getBySymbol(params.symbol)
  }
}
