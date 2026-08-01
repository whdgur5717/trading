import { Module } from "@nestjs/common"
import { ExternalMockModule } from "./external/external-mock.module"
import { MockRuntime } from "./mock-runtime"
import { OverridesModule } from "./override/module"

@Module({
  imports: [ExternalMockModule, OverridesModule],
  providers: [MockRuntime],
  exports: [MockRuntime],
})
export class MockModule {}
