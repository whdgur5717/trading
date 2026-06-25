import { Module } from "@nestjs/common"
import { HttpRequestModule } from "../../../common/http/httpRequest.module"
import { FscAdaptor } from "./fsc.adaptor"

@Module({
  imports: [HttpRequestModule],
  providers: [FscAdaptor],
  exports: [FscAdaptor],
})
export class FscModule {}
