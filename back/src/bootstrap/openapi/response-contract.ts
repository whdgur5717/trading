export type ResponseContract = {
  readonly controllerName: string
  readonly methodName: string
  readonly success: ResponseSuccess
  readonly errorCodes: readonly string[]
}

export type ResponseSuccess = {
  readonly dtoFile: string
  readonly dtoName: string
  readonly isArray: boolean
}

export type DtoModule = Record<string, unknown>

export type RuntimeClass = (abstract new (...args: never[]) => unknown) & {
  readonly name: string
  readonly prototype: object
}

export type DtoClass = RuntimeClass
