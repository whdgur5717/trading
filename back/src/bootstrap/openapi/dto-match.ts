import * as ts from "typescript"
import type { ResponseSuccess } from "./response-contract"

export type DtoCandidate = {
  readonly name: string
  readonly fileName: string
  readonly node: ts.ClassDeclaration
  readonly instanceType: ts.Type
}

export function collectDtoCandidates(
  program: ts.Program,
  checker: ts.TypeChecker
): readonly DtoCandidate[] {
  const candidates: DtoCandidate[] = []

  for (const sourceFile of program.getSourceFiles()) {
    if (
      sourceFile.isDeclarationFile ||
      !sourceFile.fileName.endsWith(".dto.ts")
    ) {
      continue
    }

    ts.forEachChild(sourceFile, function visit(node) {
      if (ts.isClassDeclaration(node) && node.name) {
        candidates.push({
          name: node.name.text,
          fileName: sourceFile.fileName,
          node,
          instanceType: checker.getDeclaredTypeOfSymbol(
            checker.getTypeAtLocation(node.name).symbol
          ),
        })
      }

      ts.forEachChild(node, visit)
    })
  }

  return candidates
}

export function matchDto(
  checker: ts.TypeChecker,
  candidates: readonly DtoCandidate[],
  successType: ts.Type,
  location: ts.Node
): ResponseSuccess | undefined {
  const arrayElementType = arrayElement(checker, successType)
  const targetType = arrayElementType ?? successType
  const matches = candidates.filter(
    (candidate) =>
      checker.isTypeAssignableTo(targetType, candidate.instanceType) &&
      checker.isTypeAssignableTo(candidate.instanceType, targetType)
  )

  if (matches.length === 0) {
    return undefined
  }

  if (matches.length > 1) {
    throw new Error(
      `Ambiguous OpenAPI DTO for ${checker.typeToString(
        targetType,
        location,
        ts.TypeFormatFlags.NoTruncation
      )}: ${matches.map((match) => match.name).join(", ")}`
    )
  }

  const [match] = matches

  if (!match) {
    return undefined
  }

  return {
    dtoFile: match.fileName,
    dtoName: match.name,
    isArray: arrayElementType !== undefined,
  }
}

function arrayElement(
  checker: ts.TypeChecker,
  type: ts.Type
): ts.Type | undefined {
  if (!checker.isArrayType(type) || !isTypeReference(type)) {
    return undefined
  }

  const typeArguments = checker.getTypeArguments(type)
  return typeArguments[0]
}

function isTypeReference(type: ts.Type): type is ts.TypeReference {
  return "target" in type
}
