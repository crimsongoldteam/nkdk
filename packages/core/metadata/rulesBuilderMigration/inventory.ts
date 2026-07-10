import ts from "typescript"
import type { BuilderCatalog, BuilderMode } from "./builderCatalog"

export type RuleInventoryItem = {
  filePath: string
  propertyPath: string
  propertyType: string
  builderName: string | undefined
  importPath: string | undefined
  mode: BuilderMode | "missing"
}

export function inventoryRulesSource(
  filePath: string,
  sourceText: string,
  catalog: BuilderCatalog
): RuleInventoryItem[] {
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const items: RuleInventoryItem[] = []

  function visitObjectLiteral(node: ts.ObjectLiteralExpression, path: string[], inRulePosition: boolean): void {
    const typeProperty = getStringProperty(node, "type")
    const isRule = inRulePosition && typeProperty !== undefined

    if (isRule) {
      const entry = catalog.get(typeProperty)
      items.push({
        filePath,
        propertyPath: path.join("."),
        propertyType: typeProperty,
        builderName: entry?.builderName,
        importPath: entry?.importPath,
        mode: entry?.mode ?? "missing",
      })
    }

    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property)) continue

      const name = getPropertyName(property.name)
      if (!name || !ts.isObjectLiteralExpression(property.initializer)) continue

      if (name === "properties") {
        visitPropertiesObject(property.initializer, [...path, name])
        continue
      }

      const nextInRulePosition = name === "defaultItemRule" || isRule || path[path.length - 1] === "properties"
      visitObjectLiteral(property.initializer, [...path, name], nextInRulePosition)
    }
  }

  function visitPropertiesObject(node: ts.ObjectLiteralExpression, path: string[]): void {
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property)) continue
      const name = getPropertyName(property.name)
      if (!name || !ts.isObjectLiteralExpression(property.initializer)) continue
      visitObjectLiteral(property.initializer, [...path, name], true)
    }
  }

  function visit(node: ts.Node): void {
    if (
      ts.isPropertyAssignment(node) &&
      getPropertyName(node.name) === "properties" &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      visitPropertiesObject(node.initializer, ["properties"])
      return
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return items
}

function getStringProperty(node: ts.ObjectLiteralExpression, name: string): string | undefined {
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue
    if (getPropertyName(property.name) !== name) continue
    if (!ts.isStringLiteral(property.initializer)) continue
    return property.initializer.text
  }
  return undefined
}

function getPropertyName(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text
  return undefined
}
