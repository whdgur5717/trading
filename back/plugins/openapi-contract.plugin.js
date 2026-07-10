import fs from "node:fs"
import path from "node:path"
import ts from "typescript"

const httpMethods = {
  Get: "get",
  Post: "post",
  Put: "put",
  Patch: "patch",
  Delete: "delete",
  Head: "head",
  Options: "options",
}

export function before(_options, program) {
  const checker = program.getTypeChecker()
  const root = program.getCurrentDirectory()
  const srcRoot = path.join(root, "src")
  const emitRoot = program.getCommonSourceDirectory()
  const dtoCandidates = []
  const errorDefinitions = new Map()

  for (const sourceFile of program.getSourceFiles()) {
    if (
      sourceFile.isDeclarationFile ||
      !sourceFile.fileName.startsWith(srcRoot)
    ) {
      continue
    }

    ts.forEachChild(sourceFile, function scan(node) {
      if (
        ts.isClassDeclaration(node) &&
        node.name &&
        extendsCreateZodDto(node)
      ) {
        dtoCandidates.push({
          name: node.name.text,
          module: distModule(emitRoot, sourceFile),
          type: checker.getDeclaredTypeOfSymbol(
            checker.getSymbolAtLocation(node.name)
          ),
        })
      }

      if (ts.isVariableStatement(node) && hasExportModifier(node)) {
        for (const declaration of node.declarationList.declarations) {
          if (
            ts.isIdentifier(declaration.name) &&
            declaration.initializer &&
            ts.isCallExpression(declaration.initializer) &&
            expressionName(declaration.initializer.expression) ===
              "defineErrors" &&
            ts.isObjectLiteralExpression(declaration.initializer.arguments[0])
          ) {
            for (const property of declaration.initializer.arguments[0]
              .properties) {
              if (
                ts.isPropertyAssignment(property) &&
                ts.isObjectLiteralExpression(property.initializer)
              ) {
                const errorType = stringProperty(property.initializer, "type")

                errorDefinitions.set(errorType, {
                  type: errorType,
                  module: distModule(emitRoot, sourceFile),
                  exportName: declaration.name.text,
                  key: propertyName(property.name),
                })
              }
            }
          }
        }
      }

      ts.forEachChild(node, scan)
    })
  }

  const routes = []

  for (const sourceFile of program.getSourceFiles()) {
    if (
      sourceFile.isDeclarationFile ||
      !sourceFile.fileName.startsWith(srcRoot)
    ) {
      continue
    }

    ts.forEachChild(sourceFile, function scan(node) {
      if (
        !ts.isClassDeclaration(node) ||
        !node.name ||
        !hasDecorator(node, "Controller")
      ) {
        ts.forEachChild(node, scan)
        return
      }

      for (const member of node.members) {
        if (!ts.isMethodDeclaration(member) || !ts.isIdentifier(member.name)) {
          continue
        }

        const routeDecorator = getRouteDecorator(member)

        if (!routeDecorator || hasDecorator(member, "SkipApiResponse")) {
          continue
        }

        const signature = checker.getSignatureFromDeclaration(member)
        const returnType = checker.getReturnTypeOfSignature(signature)
        const contract = resultContract(returnType)
        const success = successContract(contract.successType)

        routes.push({
          controller: node.name.text,
          controllerModule: distModule(emitRoot, sourceFile),
          method: member.name.text,
          httpMethod: httpMethods[decoratorName(routeDecorator)],
          controllerPath: decoratorPath(getDecorator(node, "Controller")),
          path: decoratorPath(routeDecorator),
          success,
          errors: contract.errorTypes.map((type) => {
            const definition = errorDefinitions.get(type)

            if (!definition) {
              throw new Error(`Missing error definition for ${type}`)
            }

            return definition
          }),
        })
      }

      ts.forEachChild(node, scan)
    })
  }

  fs.mkdirSync(path.join(root, "dist"), { recursive: true })
  fs.writeFileSync(
    path.join(root, "dist", "openapi-contracts.json"),
    `${JSON.stringify({ version: 1, routes }, null, 2)}\n`
  )

  return () => (sourceFile) => sourceFile

  function successContract(type) {
    const isArray = checker.isArrayType(type)
    const successType = isArray ? checker.getTypeArguments(type)[0] : type
    const matches = dtoCandidates.filter(
      (candidate) =>
        checker.isTypeAssignableTo(successType, candidate.type) &&
        checker.isTypeAssignableTo(candidate.type, successType)
    )

    if (matches.length !== 1) {
      throw new Error(
        `DTO match failed for ${checker.typeToString(successType)}`
      )
    }

    return {
      module: matches[0].module,
      exportName: matches[0].name,
      isArray,
    }
  }

  function resultContract(type) {
    const unwrappedType = unwrapPromise(type)
    const aliasName = unwrappedType.aliasSymbol?.escapedName?.toString()
    const symbolName = unwrappedType.symbol?.escapedName?.toString()
    const typeArguments =
      unwrappedType.aliasTypeArguments?.length > 0
        ? unwrappedType.aliasTypeArguments
        : checker.getTypeArguments(unwrappedType)

    if (
      (aliasName === "Result" || symbolName === "ResultAsync") &&
      typeArguments.length >= 2
    ) {
      return {
        successType: typeArguments[0],
        errorTypes: stringLiteralTypes(typeArguments[1]),
      }
    }

    if (unwrappedType.isUnion()) {
      const okType = unwrappedType.types.find(
        (member) => member.symbol?.escapedName?.toString() === "Ok"
      )
      const errType = unwrappedType.types.find(
        (member) => member.symbol?.escapedName?.toString() === "Err"
      )

      if (okType && errType) {
        const okArguments = checker.getTypeArguments(okType)
        const errArguments = checker.getTypeArguments(errType)

        return {
          successType: okArguments[0],
          errorTypes: stringLiteralTypes(errArguments[1]),
        }
      }
    }

    return {
      successType: unwrappedType,
      errorTypes: [],
    }
  }

  function stringLiteralTypes(type) {
    if (type.isUnion()) {
      return type.types.flatMap(stringLiteralTypes)
    }

    if (type.isStringLiteral()) {
      return [type.value]
    }

    const property = type.getProperty("type")

    if (!property) {
      return []
    }

    return stringLiteralTypes(
      checker.getTypeOfSymbolAtLocation(
        property,
        property.valueDeclaration ?? property.declarations[0]
      )
    )
  }
}

function extendsCreateZodDto(node) {
  return node.heritageClauses?.some((clause) =>
    clause.types.some(
      (type) =>
        ts.isCallExpression(type.expression) &&
        expressionName(type.expression.expression) === "createZodDto"
    )
  )
}

function hasExportModifier(node) {
  return node.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
  )
}

function getRouteDecorator(node) {
  return ts
    .getDecorators(node)
    ?.find((decorator) => httpMethods[decoratorName(decorator)])
}

function getDecorator(node, name) {
  return ts
    .getDecorators(node)
    ?.find((decorator) => decoratorName(decorator) === name)
}

function hasDecorator(node, name) {
  return Boolean(getDecorator(node, name))
}

function decoratorName(decorator) {
  return expressionName(
    ts.isCallExpression(decorator.expression)
      ? decorator.expression.expression
      : decorator.expression
  )
}

function expressionName(expression) {
  if (ts.isIdentifier(expression)) {
    return expression.text
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text
  }
}

function decoratorPath(decorator) {
  const argument = ts.isCallExpression(decorator.expression)
    ? decorator.expression.arguments[0]
    : undefined

  return argument && ts.isStringLiteral(argument) ? argument.text : ""
}

function stringProperty(object, name) {
  const property = object.properties.find(
    (item) =>
      ts.isPropertyAssignment(item) &&
      propertyName(item.name) === name &&
      ts.isStringLiteral(item.initializer)
  )

  return property.initializer.text
}

function propertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text
  }
}

function unwrapPromise(type) {
  if (type.symbol?.escapedName?.toString() !== "Promise") {
    return type
  }

  return type.typeArguments[0]
}

function distModule(srcRoot, sourceFile) {
  return `./${path
    .relative(srcRoot, sourceFile.fileName)
    .replaceAll(path.sep, "/")
    .replace(/\.ts$/, ".js")}`
}
