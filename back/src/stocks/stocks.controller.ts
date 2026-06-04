import { Controller, Get, Param, Query } from "@nestjs/common"
import { SuggestionDto, SuggestionQueryDto } from "./suggestion/suggestion.dto"
import { SuggestionService } from "./suggestion/suggestion.service"
import { StockCodeParamDto, StockDto, StockSearchQueryDto } from "./stocks.dto"
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

  @Get("search")
  search(@Query() query: StockSearchQueryDto): StockDto[] {
    return this.stocksService.search(query.q)
  }

  @Get(":code")
  get(@Param() params: StockCodeParamDto): StockDto {
    return this.stocksService.getByCode(params.code)
  }
}
