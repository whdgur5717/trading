import { HttpModule } from "@nestjs/axios"
import { Module } from "@nestjs/common"
import { HttpRequestProvider } from "./httpRequest.provider"

@Module({
  imports: [
    HttpModule.register({
      timeout: 5_000,
      validateStatus: () => true,
    }),
  ],
  providers: [HttpRequestProvider],
  exports: [HttpRequestProvider],
})
export class HttpRequestModule {}
