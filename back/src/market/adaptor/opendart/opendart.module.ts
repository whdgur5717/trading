import { Module } from "@nestjs/common"
import { HttpRequestModule } from "../../../common/http/httpRequest.module"
import { OpendartAdaptor } from "./opendart.adaptor"

@Module({
  imports: [HttpRequestModule],
  providers: [OpendartAdaptor],
  exports: [OpendartAdaptor],
})
export class OpendartModule {}
