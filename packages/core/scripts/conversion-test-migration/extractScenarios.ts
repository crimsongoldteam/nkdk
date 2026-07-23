import { basename } from "node:path"
import ts from "typescript"

import type { DeletedScenario, DeletedTestSource } from "./types"

const fixtureExtension = /\.(?:xml|ya?ml|json)$/i
const testModifiers = new Set(["only", "skip", "todo", "concurrent"])

export function extractScenarios(source: DeletedTestSource): DeletedScenario[] {
  const sourceFile = ts.createSourceFile(source.path, source.sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const importedFixtures = sourceFile.statements.flatMap((statement) => {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) return []
    return statement.moduleSpecifier.text.includes("__fixtures__") ? [statement.moduleSpecifier.text] : []
  })
  const scenarios: DeletedScenario[] = []

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && isTestCall(node)) {
      const position = node.getStart(sourceFile)
      const line = sourceFile.getLineAndCharacterOfPosition(position).line + 1
      const title = node.arguments[0]
      scenarios.push({
        id: `${source.deletingCommit}:${source.path}:${line}:${position}`,
        deletingCommit: source.deletingCommit,
        parentCommit: source.parentCommit,
        sourcePath: source.path,
        direction: directionFromPath(source.path),
        oldTitle: title === undefined ? "<без заголовка>" : readTitle(title, sourceFile),
        declarationText: node.getText(sourceFile),
        fixtures: unique([...importedFixtures, ...findFixtureLiterals(node)]),
        line,
      })
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return scenarios
}

function isTestCall(call: ts.CallExpression): boolean {
  const expression = call.expression
  if (isTestIdentifier(expression)) return true
  if (
    ts.isPropertyAccessExpression(expression) &&
    isTestIdentifier(expression.expression) &&
    testModifiers.has(expression.name.text)
  ) {
    return true
  }
  return ts.isCallExpression(expression) && isEachFactory(expression.expression)
}

function isEachFactory(expression: ts.LeftHandSideExpression): boolean {
  return (
    ts.isPropertyAccessExpression(expression) &&
    isTestIdentifier(expression.expression) &&
    expression.name.text === "each"
  )
}

function isTestIdentifier(node: ts.Node): node is ts.Identifier {
  return ts.isIdentifier(node) && (node.text === "it" || node.text === "test")
}

function readTitle(node: ts.Expression, sourceFile: ts.SourceFile): string {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) ? node.text : node.getText(sourceFile)
}

function findFixtureLiterals(node: ts.Node): string[] {
  const fixtures: string[] = []
  const visit = (child: ts.Node): void => {
    if (
      (ts.isStringLiteral(child) || ts.isNoSubstitutionTemplateLiteral(child)) &&
      fixtureExtension.test(child.text)
    ) {
      fixtures.push(child.text)
    }
    ts.forEachChild(child, visit)
  }
  ts.forEachChild(node, visit)
  return fixtures.sort((left, right) => left.localeCompare(right))
}

function directionFromPath(path: string): DeletedScenario["direction"] {
  const name = basename(path)
  if (name === "fromXML.test.ts") return "fromXML"
  if (name === "toYAML.test.ts") return "toYAML"
  if (name === "fromYAML.test.ts") return "fromYAML"
  if (name === "toXML.test.ts") return "toXML"
  return "standalone"
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}
