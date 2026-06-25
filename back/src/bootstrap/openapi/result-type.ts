import ts from "typescript"

export type ResultParts = {
  successType: ts.Type
  errorType: ts.Type
}

export function resultParts(
  checker: ts.TypeChecker,
  type: ts.Type
): ResultParts | undefined {
  const asyncParts = resultAsyncParts(checker, type)

  if (asyncParts) {
    return asyncParts
  }

  return resultUnionParts(checker, type)
}

export function errorCodesFromType(
  checker: ts.TypeChecker,
  errorType: ts.Type,
  location: ts.Node
): readonly string[] {
  const codes = new Set<string>()

  for (const type of unionMembers(errorType)) {
    const typeProperty = checker.getPropertyOfType(type, "type")

    if (!typeProperty) {
      continue
    }

    const propertyType = checker.getTypeOfSymbolAtLocation(
      typeProperty,
      typeProperty.valueDeclaration ?? location
    )

    for (const code of stringLiteralValues(propertyType)) {
      codes.add(code)
    }

    for (const declaration of typeProperty.declarations ?? []) {
      const code = stringLiteralFromDeclaration(declaration)

      if (code) {
        codes.add(code)
      }
    }
  }

  return [...codes]
}

function resultAsyncParts(
  checker: ts.TypeChecker,
  type: ts.Type
): ResultParts | undefined {
  if (type.symbol?.name !== "ResultAsync" || !isTypeReference(type)) {
    return undefined
  }

  const [successType, errorType] = checker.getTypeArguments(type)

  if (!successType || !errorType) {
    return undefined
  }

  return { successType, errorType }
}

function resultUnionParts(
  checker: ts.TypeChecker,
  type: ts.Type
): ResultParts | undefined {
  if (!type.isUnion()) {
    return undefined
  }

  for (const member of type.types) {
    if (member.symbol?.name !== "Ok") {
      continue
    }

    if (!isTypeReference(member)) {
      continue
    }

    const [successType, errorType] = checker.getTypeArguments(member)

    if (successType && errorType) {
      return { successType, errorType }
    }
  }

  return undefined
}

function unionMembers(type: ts.Type): readonly ts.Type[] {
  return type.isUnion() ? type.types : [type]
}

function stringLiteralValues(type: ts.Type): readonly string[] {
  if (type.isUnion()) {
    return type.types.flatMap(stringLiteralValues)
  }

  if (isStringLiteralType(type)) {
    return [type.value]
  }

  return []
}

function isStringLiteralType(type: ts.Type): type is ts.StringLiteralType {
  return (type.flags & ts.TypeFlags.StringLiteral) !== 0
}

function stringLiteralFromDeclaration(
  declaration: ts.Declaration
): string | undefined {
  if (!ts.isPropertyAssignment(declaration)) {
    return undefined
  }

  return ts.isStringLiteral(declaration.initializer)
    ? declaration.initializer.text
    : undefined
}

function isTypeReference(type: ts.Type): type is ts.TypeReference {
  return "target" in type
}
