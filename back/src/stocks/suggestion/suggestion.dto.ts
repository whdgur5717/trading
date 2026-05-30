import { createZodDto } from "nestjs-zod"
import { suggestionQuerySchema, suggestionSchema } from "./suggestion.schema"

export class SuggestionQueryDto extends createZodDto(suggestionQuerySchema) {}

export class SuggestionDto extends createZodDto(suggestionSchema) {}
