import { Module } from "@nestjs/common"
import { HttpRequestModule } from "../../../common/http/httpRequest.module"
import { OpendartClient } from "./rest/client"

@Module({
  imports: [HttpRequestModule],
  providers: [OpendartClient],
  exports: [OpendartClient],
})
export class OpendartModule {}
