import { createZodDto } from "nestjs-zod"
import { healthCheckSchema } from "./health.schema"

export class HealthCheckDto extends createZodDto(healthCheckSchema) {}
