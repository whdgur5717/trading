import { z } from "zod"

const definedErrorBrand: unique symbol = Symbol("DefinedError")

export type DefinedError<
  Type extends string = string,
  Status extends number = number,
  Data = unknown,
> = {
  readonly [definedErrorBrand]: true
  readonly type: Type
  readonly status: Status
  readonly message: string
  readonly data: Data
}

export type ErrorDefinition<
  Type extends string = string,
  Status extends number = number,
  Schema extends z.ZodType = z.ZodType,
> = {
  readonly type: Type
  readonly status: Status
  readonly message: string
  readonly description?: string
  readonly data: Schema
}

export type RegisteredErrorDefinition = {
  readonly type: string
  readonly status: number
  readonly message: string
  readonly description: string
  readonly dataSchema: z.ZodType
}

export type DefinedErrorException<Error extends DefinedError = DefinedError> =
  Error & globalThis.Error

export type ErrorFactory<
  Definition extends ErrorDefinition<string, number, z.ZodType>,
> = {
  (
    data: z.input<Definition["data"]>
  ): DefinedError<
    Definition["type"],
    Definition["status"],
    z.output<Definition["data"]>
  >
  readonly type: Definition["type"]
  readonly status: Definition["status"]
  readonly message: Definition["message"]
  readonly description: string
  readonly dataSchema: Definition["data"]
}

export type ErrorOf<FactoryOrFactories> = FactoryOrFactories extends (
  ...args: never[]
) => infer Error
  ? Error
  : FactoryOrFactories extends object
    ? {
        readonly [Name in keyof FactoryOrFactories]: ErrorOf<
          FactoryOrFactories[Name]
        >
      }[keyof FactoryOrFactories]
    : never

type ErrorFactories<
  Definitions extends Record<
    string,
    ErrorDefinition<string, number, z.ZodType>
  >,
> = {
  readonly [Name in keyof Definitions]: ErrorFactory<Definitions[Name]>
}

const errorRegistry = new Map<string, RegisteredErrorDefinition>()

export function defineErrors<
  const Definitions extends Record<
    string,
    ErrorDefinition<string, number, z.ZodType>
  >,
>(definitions: Definitions): ErrorFactories<Definitions> {
  return Object.fromEntries(
    Object.entries(definitions).map(([name, definition]) => {
      registerErrorDefinition(definition)

      const factory = ((data: unknown) => {
        const error = {
          type: definition.type,
          status: definition.status,
          message: definition.message,
          data: definition.data.parse(data),
        }

        Object.defineProperty(error, definedErrorBrand, {
          value: true,
        })

        return error
      }) as ErrorFactory<typeof definition>

      Object.defineProperties(factory, {
        type: { value: definition.type, enumerable: true },
        status: { value: definition.status, enumerable: true },
        message: { value: definition.message, enumerable: true },
        description: {
          value: definition.description ?? definition.message,
          enumerable: true,
        },
        dataSchema: { value: definition.data, enumerable: true },
      })

      return [name, factory]
    })
  ) as ErrorFactories<Definitions>
}

export function isDefinedError(error: unknown): error is DefinedError {
  return (
    !!error &&
    typeof error === "object" &&
    definedErrorBrand in error &&
    error[definedErrorBrand] === true
  )
}

export function definedErrorException<Error extends DefinedError>(
  error: Error
): DefinedErrorException<Error> {
  const exception = new Error(error.message) as DefinedErrorException<Error>

  Object.defineProperties(exception, {
    [definedErrorBrand]: { value: true },
    type: { value: error.type, enumerable: true },
    status: { value: error.status, enumerable: true },
    message: { value: error.message, enumerable: true },
    data: { value: error.data, enumerable: true },
  })

  return exception
}

export function getErrorDefinition(
  type: string
): RegisteredErrorDefinition | undefined {
  return errorRegistry.get(type)
}

export function getErrorDefinitions(): readonly RegisteredErrorDefinition[] {
  return [...errorRegistry.values()]
}

function registerErrorDefinition(
  definition: ErrorDefinition<string, number, z.ZodType>
): void {
  const existing = errorRegistry.get(definition.type)
  const description = definition.description ?? definition.message

  if (existing) {
    if (
      existing.status !== definition.status ||
      existing.message !== definition.message ||
      existing.description !== description ||
      existing.dataSchema !== definition.data
    ) {
      throw new Error(`Duplicate error definition: ${definition.type}`)
    }

    return
  }

  errorRegistry.set(definition.type, {
    type: definition.type,
    status: definition.status,
    message: definition.message,
    description,
    dataSchema: definition.data,
  })
}
