import ts from "typescript"
import type { BuilderCatalog, BuilderCatalogEntry } from "./builderCatalog"

export type TransformResult = {
  changed: boolean
  code: string
  convertedCount: number
  missingTypes: string[]
}

export function transformRulesSource(filePath: string, sourceText: string, catalog: BuilderCatalog): TransformResult {
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const usedImports = new Map<string, Set<string>>()
  const missingTypes = new Set<string>()
  let convertedCount = 0

  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    const factory = context.factory

    const visitObjectLiteral = (node: ts.ObjectLiteralExpression, inRulePosition: boolean): ts.Expression => {
      const typeProperty = getStringProperty(node, "type")
      const entry = typeProperty ? catalog.get(typeProperty) : undefined

      const nextProperties = node.properties.map((property) => {
        if (!ts.isPropertyAssignment(property)) return property
        const name = getPropertyName(property.name)
        if (!name || !ts.isObjectLiteralExpression(property.initializer)) return property

        if (name === "properties") {
          return factory.updatePropertyAssignment(property, property.name, visitPropertiesObject(property.initializer))
        }

        const nestedInRulePosition = name === "defaultItemRule" || inRulePosition
        return factory.updatePropertyAssignment(
          property,
          property.name,
          visitObjectLiteral(property.initializer, nestedInRulePosition)
        )
      })

      const rewritten = factory.updateObjectLiteralExpression(node, nextProperties)

      if (!inRulePosition || !typeProperty) return rewritten
      if (!entry) {
        missingTypes.add(typeProperty)
        return rewritten
      }

      convertedCount += 1
      addUsedImport(usedImports, entry)
      return factory.createCallExpression(factory.createIdentifier(entry.builderName), undefined, [
        factory.updateObjectLiteralExpression(
          rewritten,
          rewritten.properties.filter((property) => !isPropertyNamed(property, "type"))
        ),
      ])
    }

    const visitPropertiesObject = (node: ts.ObjectLiteralExpression): ts.ObjectLiteralExpression => {
      return factory.updateObjectLiteralExpression(
        node,
        node.properties.map((property) => {
          if (!ts.isPropertyAssignment(property)) return property
          if (!ts.isObjectLiteralExpression(property.initializer)) return property
          return factory.updatePropertyAssignment(
            property,
            property.name,
            visitObjectLiteral(property.initializer, true)
          )
        })
      )
    }

    const visit: ts.Visitor = (node) => {
      if (
        ts.isPropertyAssignment(node) &&
        getPropertyName(node.name) === "properties" &&
        ts.isObjectLiteralExpression(node.initializer)
      ) {
        return factory.updatePropertyAssignment(node, node.name, visitPropertiesObject(node.initializer))
      }
      return ts.visitEachChild(node, visit, context)
    }

    return (node) => ts.visitNode(node, visit) as ts.SourceFile
  }

  const transformed = ts.transform(sourceFile, [transformer]).transformed[0]
  const withImports = addImports(transformed, usedImports)
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
  const code = printer.printFile(withImports)

  return {
    changed: convertedCount > 0,
    code,
    convertedCount,
    missingTypes: [...missingTypes].sort(),
  }
}

function addUsedImport(imports: Map<string, Set<string>>, entry: BuilderCatalogEntry): void {
  const namedImports = imports.get(entry.importPath) ?? new Set<string>()
  namedImports.add(entry.builderName)
  imports.set(entry.importPath, namedImports)
}

function addImports(sourceFile: ts.SourceFile, imports: Map<string, Set<string>>): ts.SourceFile {
  if (imports.size === 0) return sourceFile

  const factory = ts.factory
  const existing = new Map<string, Set<string>>()

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue
    const clause = statement.importClause
    if (!clause?.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue
    existing.set(
      statement.moduleSpecifier.text,
      new Set(clause.namedBindings.elements.map((element) => element.name.text))
    )
  }

  const newImports: ts.ImportDeclaration[] = []
  for (const [moduleSpecifier, names] of [...imports.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const existingNames = existing.get(moduleSpecifier) ?? new Set<string>()
    const missingNames = [...names].filter((name) => !existingNames.has(name)).sort()
    if (missingNames.length === 0) continue

    newImports.push(
      factory.createImportDeclaration(
        undefined,
        factory.createImportClause(
          false,
          undefined,
          factory.createNamedImports(
            missingNames.map((name) => factory.createImportSpecifier(false, undefined, factory.createIdentifier(name)))
          )
        ),
        factory.createStringLiteral(moduleSpecifier)
      )
    )
  }

  return factory.updateSourceFile(sourceFile, [...newImports, ...sourceFile.statements])
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

function isPropertyNamed(property: ts.ObjectLiteralElementLike, name: string): boolean {
  return ts.isPropertyAssignment(property) && getPropertyName(property.name) === name
}

function getPropertyName(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text
  return undefined
}
