import { Module } from "@nestjs/common"
import { PricesModule } from "../prices/prices.module"
import { ReturnsController } from "./returns.controller"
import { ReturnsService } from "./returns.service"

@Module({
  imports: [PricesModule],
  controllers: [ReturnsController],
  providers: [ReturnsService],
})
export class ReturnsModule {}
