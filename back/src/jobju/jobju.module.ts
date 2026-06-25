import { Module } from "@nestjs/common"
import { StocksModule } from "../stocks/stocks.module"
import { JobjuController } from "./jobju.controller"
import { JobjuService } from "./jobju.service"

@Module({
  imports: [StocksModule],
  controllers: [JobjuController],
  providers: [JobjuService],
})
export class JobjuModule {}
