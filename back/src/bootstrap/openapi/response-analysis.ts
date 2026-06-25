import { resolve } from "node:path"
import * as ts from "typescript"
import type { ResponseContract } from "./response-contract"
import { collectDtoCandidates, matchDto } from "./dto-match"
import { errorCodesFromType, resultParts } from "./result-type"

const ROUTE_DECORATORS = new Set([
  "Get",
  "Post",
  "Put",
  "Patch",
  "Delete",
  "Options",
  "Head",
  "All",
])
const SKIP_DECORATORS = new Set(["SkipApiResponse"])

export function analyzeResponseContracts(): readonly ResponseContract[] {
  const program = createProgram()
  const checker = program.getTypeChecker()
  const dtoCandidates = collectDtoCandidates(program, checker)
  const contracts: ResponseContract[] = []

  for (const sourceFile of program.getSourceFiles()) {
    if (
      sourceFile.isDeclarationFile ||
      !sourceFile.fileName.endsWith(".controller.ts")
    ) {
      continue
    }

    collectControllerContracts(checker, dtoCandidates, sourceFile, contracts)
  }

  return contracts
}

function createProgram(): ts.Program {
  const configPath = ts.findConfigFile(
    process.cwd(),
    (fileName) => ts.sys.fileExists(fileName),
    "tsconfig.json"
  )

  if (!configPath) {
    throw new Error("tsconfig.json was not found for OpenAPI analysis")
  }

  const config = ts.readConfigFile(configPath, (fileName) =>
    ts.sys.readFile(fileName)
  )

  if (config.error) {
    throw new Error(
      ts.flattenDiagnosticMessageText(config.error.messageText, "\n")
    )
  }

  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    resolve(configPath, "..")
  )

  return ts.createProgram(parsed.fileNames, parsed.options)
}

function collectControllerContracts(
  checker: ts.TypeChecker,
  dtoCandidates: ReturnType<typeof collectDtoCandidates>,
  sourceFile: ts.SourceFile,
  contracts: ResponseContract[]
): void {
  ts.forEachChild(sourceFile, function visit(node) {
    if (ts.isClassDeclaration(node) && node.name) {
      for (const member of node.members) {
        if (isMethodWithIdentifier(member)) {
          const contract = analyzeMethod(
            checker,
            dtoCandidates,
            node.name.text,
            member
          )

          if (contract) {
            contracts.push(contract)
          }
        }
      }
    }

    ts.forEachChild(node, visit)
  })
}

function isMethodWithIdentifier(
  member: ts.ClassElement
): member is ts.MethodDeclaration & { name: ts.Identifier } {
  return ts.isMethodDeclaration(member) && ts.isIdentifier(member.name)
}

function analyzeMethod(
  checker: ts.TypeChecker,
  dtoCandidates: ReturnType<typeof collectDtoCandidates>,
  controllerName: string,
  method: ts.MethodDeclaration & { name: ts.Identifier }
): ResponseContract | undefined {
  if (
    !hasDecorator(method, ROUTE_DECORATORS) ||
    hasDecorator(method, SKIP_DECORATORS)
  ) {
    return undefined
  }

  const signature = checker.getSignatureFromDeclaration(method)

  if (!signature) {
    return undefined
  }

  const returnType = checker.getReturnTypeOfSignature(signature)
  const parts = resultParts(checker, returnType)
  const successType = parts?.successType ?? returnType
  const success = matchDto(checker, dtoCandidates, successType, method)

  if (!success) {
    return undefined
  }

  return {
    controllerName,
    methodName: method.name.getText(),
    success,
    errorCodes: parts
      ? errorCodesFromType(checker, parts.errorType, method)
      : [],
  }
}

function hasDecorator(node: ts.Node, names: ReadonlySet<string>): boolean {
  if (!ts.canHaveDecorators(node)) {
    return false
  }

  for (const decorator of ts.getDecorators(node) ?? []) {
    const name = decoratorName(decorator)

    if (name && names.has(name)) {
      return true
    }
  }

  return false
}

function decoratorName(decorator: ts.Decorator): string | undefined {
  const expression = decorator.expression

  if (ts.isCallExpression(expression)) {
    return expressionName(expression.expression)
  }

  return expressionName(expression)
}

function expressionName(expression: ts.Expression): string | undefined {
  if (ts.isIdentifier(expression)) {
    return expression.text
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text
  }

  return undefined
}
