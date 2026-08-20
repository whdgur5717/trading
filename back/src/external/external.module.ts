import { Module } from "@nestjs/common"
import { ExternalService } from "./external.service"
import { FscModule } from "./provider/fsc/module"
import { KisModule } from "./provider/kis/module"
import { OpendartModule } from "./provider/opendart/module"

@Module({
  imports: [KisModule, FscModule, OpendartModule],
  providers: [ExternalService],
  exports: [ExternalService],
})
export class ExternalModule {}
