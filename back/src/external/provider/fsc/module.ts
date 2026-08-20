import { Module } from "@nestjs/common"
import { HttpRequestModule } from "../../../common/http/httpRequest.module"
import { FscClient } from "./rest/client"

@Module({
  imports: [HttpRequestModule],
  providers: [FscClient],
  exports: [FscClient],
})
export class FscModule {}
