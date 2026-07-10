import { Controller, Get } from "@nestjs/common"
import { SkipApiResponse } from "../common/api/response"
import { HealthCheckDto } from "./health.dto"

@Controller("health")
export class HealthController {
  @Get()
  @SkipApiResponse()
  check(): HealthCheckDto {
    return {
      status: "ok" as const,
    }
  }
}
