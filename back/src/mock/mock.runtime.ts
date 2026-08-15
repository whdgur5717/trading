import { Injectable } from "@nestjs/common"
import { ExternalRuntime } from "./external/external.runtime"
import { OverrideStore } from "./override/override.store"
import { SseStreamWriter } from "./override/sse-stream.writer"

@Injectable()
export class MockRuntime {
  constructor(
    private readonly external: ExternalRuntime,
    private readonly store: OverrideStore,
    private readonly sse: SseStreamWriter
  ) {}

  reset(): void {
    this.sse.reset()
    this.store.reset()
    this.external.reset()
  }
}
