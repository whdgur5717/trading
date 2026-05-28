import { Controller, Get } from "@nestjs/common"
import { HealthCheckDto } from "./health.dto"

@Controller("health")
export class HealthController {
  @Get()
  check(): HealthCheckDto {
    return {
      status: "ok" as const,
    }
  }
}
