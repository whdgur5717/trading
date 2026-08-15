import { Module } from "@nestjs/common"
import { ExternalRuntime } from "./external.runtime"

@Module({
  providers: [ExternalRuntime],
  exports: [ExternalRuntime],
})
export class ExternalModule {}
