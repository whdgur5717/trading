import { Injectable } from "@nestjs/common"
import { ExternalMockRuntime } from "./external/external-mock.module"
import { SseStreamWriter } from "./override/sse-stream-writer"
import { OverrideStore } from "./override/store"

@Injectable()
export class MockRuntime {
  constructor(
    private readonly external: ExternalMockRuntime,
    private readonly store: OverrideStore,
    private readonly sse: SseStreamWriter
  ) {}

  reset(): void {
    this.sse.reset()
    this.store.reset()
    this.external.reset()
  }
}
