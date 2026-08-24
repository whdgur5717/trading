import { createZodDto } from "nestjs-zod"
import {
  disconnectedEventSchema,
  heartbeatEventSchema,
  marketEventSchema,
  priceEventSchema,
  realtimeErrorEventSchema,
  reconnectedEventSchema,
  streamQuerySchema,
  subscribedEventSchema,
} from "./realtime.schema"

export class StreamQueryDto extends createZodDto(streamQuerySchema) {}

export class SubscribedEventDto extends createZodDto(subscribedEventSchema) {}

export class PriceEventDto extends createZodDto(priceEventSchema) {}

export class MarketEventDto extends createZodDto(marketEventSchema) {}

export class HeartbeatEventDto extends createZodDto(heartbeatEventSchema) {}

export class DisconnectedEventDto extends createZodDto(
  disconnectedEventSchema
) {}

export class ReconnectedEventDto extends createZodDto(reconnectedEventSchema) {}

export class RealtimeErrorEventDto extends createZodDto(
  realtimeErrorEventSchema
) {}
