import {
  MiddlewareConsumer,
  Module,
  RequestMethod,
  type NestModule,
} from "@nestjs/common"
import { OverrideMiddleware } from "./middleware"
import { SseStreamWriter } from "./sse-stream-writer"
import { OverrideStore } from "./store"

@Module({
  providers: [OverrideStore, SseStreamWriter],
  exports: [OverrideStore, SseStreamWriter],
})
export class OverridesModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(OverrideMiddleware).forRoutes({
      path: "*splat",
      method: RequestMethod.ALL,
    })
  }
}
