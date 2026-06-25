import { existsSync } from "node:fs"
import { createRequire } from "node:module"
import { relative, resolve } from "node:path"
import { ApiResponse } from "@nestjs/swagger"
import { ModulesContainer } from "@nestjs/core"
import type { NestExpressApplication } from "@nestjs/platform-express"
import { analyzeResponseContracts } from "./response-analysis"
import type { DtoClass, DtoModule, RuntimeClass } from "./response-contract"
import { errorResponses, successResponse } from "./response-schema"

const requireModule = createRequire(__filename)
const API_EXTRA_MODELS_METADATA = "swagger/apiExtraModels"

export function applyOpenApiResponseMetadata(
  app: NestExpressApplication
): void {
  const controllers = controllerMap(app)

  for (const contract of analyzeResponseContracts()) {
    const controller = controllers.get(contract.controllerName)
    const descriptor = controller
      ? Object.getOwnPropertyDescriptor(
          controller.prototype,
          contract.methodName
        )
      : undefined

    if (!controller || !descriptor) {
      continue
    }

    const dto = loadDto(contract.success.dtoFile, contract.success.dtoName)
    addExtraModel(descriptor, dto)
    ApiResponse(successResponse(dto, contract.success.isArray))(
      controller.prototype,
      contract.methodName,
      descriptor
    )

    for (const response of errorResponses(contract.errorCodes)) {
      ApiResponse(response)(
        controller.prototype,
        contract.methodName,
        descriptor
      )
    }
  }
}

function controllerMap(
  app: NestExpressApplication
): ReadonlyMap<string, RuntimeClass> {
  const controllers = new Map<string, RuntimeClass>()
  const modules = app.get(ModulesContainer)

  for (const moduleRef of modules.values()) {
    for (const wrapper of moduleRef.controllers.values()) {
      if (isRuntimeClass(wrapper.metatype)) {
        controllers.set(wrapper.metatype.name, wrapper.metatype)
      }
    }
  }

  return controllers
}

function loadDto(fileName: string, exportName: string): DtoClass {
  const moduleValue = loadDtoModule(fileName)
  const dto = moduleValue[exportName]

  if (!isRuntimeClass(dto)) {
    throw new Error(
      `OpenAPI DTO ${exportName} was not exported from ${fileName}`
    )
  }

  return dto
}

function loadDtoModule(fileName: string): DtoModule {
  const candidates = dtoModuleFiles(fileName)

  for (const candidate of candidates) {
    if (moduleFileExists(candidate)) {
      const moduleValue: unknown = requireModule(candidate)

      if (isDtoModule(moduleValue)) {
        return moduleValue
      }
    }
  }

  throw new Error(`OpenAPI DTO module was not found for ${fileName}`)
}

function dtoModuleFiles(fileName: string): readonly string[] {
  const sourceRoot = resolve(process.cwd(), "src")
  const distRoot = resolve(process.cwd(), "dist")
  const sourceRelativePath = relative(sourceRoot, fileName)
  const projectRelativePath = relative(process.cwd(), fileName)

  return [
    resolve(distRoot, sourceRelativePath).replace(/\.ts$/, ".js"),
    resolve(distRoot, projectRelativePath).replace(/\.ts$/, ".js"),
    fileName.replace(/\.ts$/, ""),
  ]
}

function moduleFileExists(fileName: string): boolean {
  return (
    existsSync(fileName) ||
    existsSync(`${fileName}.js`) ||
    existsSync(`${fileName}.ts`)
  )
}

function isDtoModule(value: unknown): value is DtoModule {
  return !!value && typeof value === "object"
}

function isRuntimeClass(value: unknown): value is RuntimeClass {
  return typeof value === "function"
}

function addExtraModel(descriptor: PropertyDescriptor, dto: DtoClass): void {
  const target = descriptorTarget(descriptor)
  const existing: unknown = Reflect.getMetadata(
    API_EXTRA_MODELS_METADATA,
    target
  )
  const models = Array.isArray(existing) ? existing.filter(isRuntimeClass) : []

  Reflect.defineMetadata(API_EXTRA_MODELS_METADATA, [...models, dto], target)
}

function descriptorTarget(descriptor: PropertyDescriptor): RuntimeClass {
  const value: unknown = descriptor.value

  if (!isRuntimeClass(value)) {
    throw new Error("OpenAPI metadata target is not a method")
  }

  return value
}
