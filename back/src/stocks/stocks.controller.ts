import { Controller, Get, Param, Query } from "@nestjs/common"
import { KisService } from "../kis/kis.service"
import { SuggestionDto, SuggestionQueryDto } from "./suggestion/suggestion.dto"
import { SuggestionService } from "./suggestion/suggestion.service"
import {
  StockCodeParamDto,
  StockCurrentDto,
  StockDto,
  StockHistoryDto,
  StockHistoryQueryDto,
  StockSearchQueryDto,
} from "./stocks.dto"
import { StocksService } from "./stocks.service"

@Controller("stocks")
export class StocksController {
  constructor(
    private readonly stocksService: StocksService,
    private readonly suggestionService: SuggestionService,
    private readonly kisService: KisService
  ) {}

  @Get("suggestion")
  suggestion(@Query() query: SuggestionQueryDto): SuggestionDto {
    return this.suggestionService.suggest(query.q, query.limit)
  }

  @Get("search")
  search(@Query() query: StockSearchQueryDto): StockDto[] {
    return this.stocksService.search(query.q)
  }

  @Get(":code/current")
  async current(@Param() params: StockCodeParamDto): Promise<StockCurrentDto> {
    const stock = this.stocksService.getByCode(params.code)
    const price = await this.kisService.getCurrentPrice(
      params.code,
      stock.kisMarketCode
    )

    return {
      stock,
      marketCode: stock.kisMarketCode,
      price,
    }
  }

  @Get(":code/history")
  async history(
    @Param() params: StockCodeParamDto,
    @Query() query: StockHistoryQueryDto
  ): Promise<StockHistoryDto> {
    const stock = this.stocksService.getByCode(params.code)
    const result = await this.kisService.getDailyPrice(
      params.code,
      query.date,
      stock.kisMarketCode
    )

    return {
      stock,
      requestedDate: query.date,
      marketCode: stock.kisMarketCode,
      ...result,
    }
  }
}
