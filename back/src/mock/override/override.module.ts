import {
  MiddlewareConsumer,
  Module,
  RequestMethod,
  type NestModule,
} from "@nestjs/common"
import { OverrideMiddleware } from "./override.middleware"
import { OverrideStore } from "./override.store"
import { SseStreamWriter } from "./sse-stream.writer"

@Module({
  providers: [OverrideStore, SseStreamWriter],
  exports: [OverrideStore, SseStreamWriter],
})
export class OverrideModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(OverrideMiddleware).forRoutes({
      path: "*splat",
      method: RequestMethod.ALL,
    })
  }
}
