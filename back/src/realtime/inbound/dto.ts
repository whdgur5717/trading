import { createZodDto } from "nestjs-zod"
import {
  disconnectedEventSchema,
  heartbeatEventSchema,
  priceEventSchema,
  reconnectedEventSchema,
  streamQuerySchema,
  subscribedEventSchema,
  unavailableEventSchema,
} from "./schema"

export class StreamQueryDto extends createZodDto(streamQuerySchema) {}

export class SubscribedEventDto extends createZodDto(subscribedEventSchema) {}

export class PriceEventDto extends createZodDto(priceEventSchema) {}

export class HeartbeatEventDto extends createZodDto(heartbeatEventSchema) {}

export class DisconnectedEventDto extends createZodDto(
  disconnectedEventSchema
) {}

export class ReconnectedEventDto extends createZodDto(reconnectedEventSchema) {}

export class UnavailableEventDto extends createZodDto(unavailableEventSchema) {}
