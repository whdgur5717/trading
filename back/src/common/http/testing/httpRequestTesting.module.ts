import { Module } from "@nestjs/common"
import { vi } from "vitest"
import { HttpRequestProvider } from "../httpRequest.provider"

export class HttpRequestProviderMock {
  request = vi.fn<HttpRequestProvider["request"]>()
}

@Module({
  providers: [
    {
      provide: HttpRequestProvider,
      useClass: HttpRequestProviderMock,
    },
  ],
  exports: [HttpRequestProvider],
})
export class HttpRequestTestingModule {}
