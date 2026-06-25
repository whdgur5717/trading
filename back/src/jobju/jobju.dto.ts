import { createZodDto } from "nestjs-zod"
import {
  jobjuQuerySchema,
  jobjuScoreSchema,
  jobjuSignalSchema,
} from "./jobju.schema"

export class JobjuQueryDto extends createZodDto(jobjuQuerySchema) {}

export class JobjuSignalDto extends createZodDto(jobjuSignalSchema) {}

export class JobjuScoreDto extends createZodDto(jobjuScoreSchema) {}
