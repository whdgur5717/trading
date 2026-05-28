import { createZodDto } from "nestjs-zod"
import {
  realtimeDisconnectedSchema,
  realtimeErrorSchema,
  realtimeHeartbeatSchema,
  realtimePriceSchema,
  realtimeReconnectedSchema,
  realtimeSubscribedSchema,
  streamQuerySchema,
} from "./realtime.schema"

export class StreamQueryDto extends createZodDto(streamQuerySchema) {}

export class RealtimePriceDto extends createZodDto(realtimePriceSchema) {}

export class RealtimeSubscribedDto extends createZodDto(
  realtimeSubscribedSchema
) {}

export class RealtimeHeartbeatDto extends createZodDto(
  realtimeHeartbeatSchema
) {}

export class RealtimeErrorDto extends createZodDto(realtimeErrorSchema) {}

export class RealtimeDisconnectedDto extends createZodDto(
  realtimeDisconnectedSchema
) {}

export class RealtimeReconnectedDto extends createZodDto(
  realtimeReconnectedSchema
) {}
