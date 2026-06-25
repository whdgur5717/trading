import { Controller, Get, Query } from "@nestjs/common"
import { JobjuQueryDto } from "./jobju.dto"
import { JobjuService } from "./jobju.service"

@Controller("jobju")
export class JobjuController {
  constructor(private jobjuService: JobjuService) {}

  @Get("score")
  score(@Query() query: JobjuQueryDto) {
    return this.jobjuService.score(query.symbol)
  }
}
