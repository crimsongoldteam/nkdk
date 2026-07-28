import { dirname, extname, resolve } from "node:path"
import ts from "typescript"
import type { CanonicalRuleOrder } from "../../metadata/ruleOrderAnalysis/canonicalOrder"
import type { RuleOrderSource } from "../../metadata/ruleOrderAnalysis/types"

export interface RuleSourceEdit {
  filePath: string
  originalText: string
  updatedText: string
  candidates: readonly string[]
}

interface SourceModel {
  filePath: string
  text: string
  sourceFile: ts.SourceFile
  variables: Map<string, ts.Expression>
  imports: Map<string, { filePath: string; importedName: string }>
}

interface SourceGraph {
  models: Map<string, SourceModel>
}

interface TextReplacement {
  start: number
  end: number
  text: string
  candidate: string
}

export async function buildRuleSourceEdits(params: {
  orders: readonly CanonicalRuleOrder[]
  sources: readonly RuleOrderSource[]
  readFile(path: string): Promise<string>
}): Promise<readonly RuleSourceEdit[]> {
  const graph: SourceGraph = { models: new Map() }
  const allSources = uniqueSources([...params.sources, ...params.orders.map((order) => order.source)])
  for (const source of allSources) await loadSourceModel(graph, source.filePath, params.readFile)

  const replacements = new Map<string, Map<string, TextReplacement>>()
  for (const source of allSources) {
    const rule = resolveRuleObject(graph, source)
    const properties = propertyObject(graph, rule, "properties", source.candidate)
    collectNumericOrderRemovals({
      graph,
      model: properties.model,
      object: properties.object,
      candidate: source.candidate,
      ancestors: new Set(),
      replacements,
    })
  }

  for (const order of params.orders) {
    const rule = resolveRuleObject(graph, order.source)
    const properties = propertyObject(graph, rule, "properties", order.source.candidate)
    const propertyKeys = new Set(
      expandObject(graph, properties.model, properties.object, order.source.candidate, new Set()).map(
        (entry) => entry.key
      )
    )
    const missing = order.propertyKeys.filter((key) => !propertyKeys.has(key))
    if (missing.length > 0) {
      throw new Error(`${order.source.candidate} не содержит свойства xmlOrder: ${missing.join(", ")}`)
    }
    addXMLOrderReplacement(rule.model, rule.object, order.propertyKeys, order.source.candidate, replacements)
  }

  const edits: RuleSourceEdit[] = []
  for (const [filePath, byRange] of [...replacements].sort(([left], [right]) => bytewiseCompare(left, right))) {
    const model = graph.models.get(filePath)
    if (model === undefined) throw new Error(`Не загружен ${filePath}`)
    const fileReplacements = [...byRange.values()].sort((left, right) => right.start - left.start)
    assertNonOverlapping(fileReplacements, filePath)
    let updatedText = model.text
    for (const replacement of fileReplacements) {
      updatedText =
        updatedText.slice(0, replacement.start) + replacement.text + updatedText.slice(replacement.end)
    }
    assertParses(filePath, updatedText)
    if (updatedText === model.text) continue
    edits.push({
      filePath,
      originalText: model.text,
      updatedText,
      candidates: [...new Set(fileReplacements.map((replacement) => replacement.candidate))].sort(bytewiseCompare),
    })
  }
  return edits
}

function uniqueSources(sources: readonly RuleOrderSource[]): readonly RuleOrderSource[] {
  const result = new Map<string, RuleOrderSource>()
  for (const source of sources) {
    const existing = result.get(source.candidate)
    if (existing !== undefined && JSON.stringify(existing) !== JSON.stringify(source)) {
      throw new Error(`Различающиеся source для ${source.candidate}`)
    }
    result.set(source.candidate, source)
  }
  return [...result.values()].sort((left, right) => bytewiseCompare(left.candidate, right.candidate))
}

async function loadSourceModel(
  graph: SourceGraph,
  filePath: string,
  readFile: (path: string) => Promise<string>
): Promise<SourceModel> {
  const existing = graph.models.get(filePath)
  if (existing !== undefined) return existing
  const model = createSourceModel(filePath, await readFile(filePath))
  graph.models.set(filePath, model)
  for (const imported of model.imports.values()) {
    await loadSourceModel(graph, imported.filePath, readFile)
  }
  return model
}

function createSourceModel(filePath: string, text: string): SourceModel {
  const sourceFile = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const variables = new Map<string, ts.Expression>()
  const imports = new Map<string, { filePath: string; importedName: string }>()
  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      isRulesImport(statement.moduleSpecifier.text) &&
      statement.importClause?.namedBindings !== undefined &&
      ts.isNamedImports(statement.importClause.namedBindings)
    ) {
      const importedFilePath = resolveImportPath(filePath, statement.moduleSpecifier.text)
      for (const element of statement.importClause.namedBindings.elements) {
        if (element.isTypeOnly) continue
        imports.set(element.name.text, {
          filePath: importedFilePath,
          importedName: element.propertyName?.text ?? element.name.text,
        })
      }
      continue
    }
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer !== undefined) {
        variables.set(declaration.name.text, declaration.initializer)
      }
    }
  }
  return { filePath, text, sourceFile, variables, imports }
}

function isRulesImport(specifier: string): boolean {
  return specifier === "./rules" || specifier.endsWith("/rules") || specifier.endsWith("/rules.ts")
}

function resolveImportPath(containingFile: string, specifier: string): string {
  const resolved = resolve(dirname(containingFile), specifier)
  return extname(resolved) === ".ts" ? resolved : `${resolved}.ts`
}

function resolveRuleObject(
  graph: SourceGraph,
  source: RuleOrderSource
): { model: SourceModel; object: ts.ObjectLiteralExpression } {
  const model = graph.models.get(source.filePath)
  if (model === undefined) throw new Error(`Не загружен ${source.filePath}`)
  const exported = model.variables.get(source.exportName)
  if (exported === undefined) throw new Error(`Не найден экспорт ${source.candidate}`)
  const resolved = resolvePath(graph, model, exported, source.propertyPath, source.candidate)
  if (!ts.isObjectLiteralExpression(resolved.expression)) {
    throw new Error(`${source.candidate} не является объектным литералом`)
  }
  return { model: resolved.model, object: resolved.expression }
}

function resolvePath(
  graph: SourceGraph,
  model: SourceModel,
  expression: ts.Expression,
  path: readonly string[],
  candidate: string
): { model: SourceModel; expression: ts.Expression } {
  let current = unwrapExpression(graph, model, expression, candidate)
  for (const segment of path) {
    if (ts.isObjectLiteralExpression(current.expression)) {
      current = unwrapExpression(
        graph,
        current.model,
        propertyInitializer(current.expression, segment, candidate),
        candidate
      )
      continue
    }
    if (ts.isArrayLiteralExpression(current.expression)) {
      const index = Number(segment)
      if (!Number.isSafeInteger(index) || current.expression.elements[index] === undefined) {
        throw new Error(`Не найден ${candidate}.${path.join(".")}`)
      }
      current = unwrapExpression(
        graph,
        current.model,
        current.expression.elements[index] as ts.Expression,
        candidate
      )
      continue
    }
    throw new Error(`Невозможно пройти путь ${candidate}.${path.join(".")}`)
  }
  return current
}

function propertyObject(
  graph: SourceGraph,
  resolved: { model: SourceModel; object: ts.ObjectLiteralExpression },
  name: string,
  candidate: string
): { model: SourceModel; object: ts.ObjectLiteralExpression } {
  const value = unwrapExpression(
    graph,
    resolved.model,
    propertyInitializer(resolved.object, name, candidate),
    candidate
  )
  if (!ts.isObjectLiteralExpression(value.expression)) {
    throw new Error(`${candidate}.${name} не является объектным литералом`)
  }
  return { model: value.model, object: value.expression }
}

function propertyInitializer(object: ts.ObjectLiteralExpression, name: string, candidate: string): ts.Expression {
  let result: ts.Expression | undefined
  for (const element of object.properties) {
    if (element.name !== undefined && ts.isComputedPropertyName(element.name)) {
      throw new Error(`Вычисляемое computed-свойство не поддерживается в ${candidate}`)
    }
    if (!ts.isPropertyAssignment(element) && !ts.isShorthandPropertyAssignment(element)) continue
    if (propertyName(element.name) !== name) continue
    result = ts.isPropertyAssignment(element) ? element.initializer : element.name
  }
  if (result === undefined) throw new Error(`Не найдено свойство ${name} в ${candidate}`)
  return result
}

function unwrapExpression(
  graph: SourceGraph,
  model: SourceModel,
  expression: ts.Expression,
  candidate: string
): { model: SourceModel; expression: ts.Expression } {
  const current = unwrapSyntax(expression)
  if (ts.isIdentifier(current)) {
    const resolved = model.variables.get(current.text)
    if (resolved !== undefined) return unwrapExpression(graph, model, resolved, candidate)
    const imported = model.imports.get(current.text)
    if (imported !== undefined) {
      const importedModel = graph.models.get(imported.filePath)
      const importedExpression = importedModel?.variables.get(imported.importedName)
      if (importedModel === undefined || importedExpression === undefined) {
        throw new Error(`Не удалось разрешить импорт ${current.text} в ${candidate}`)
      }
      return unwrapExpression(graph, importedModel, importedExpression, candidate)
    }
    throw new Error(`Не удалось разрешить ${current.text} в ${candidate}`)
  }
  if (ts.isPropertyAccessExpression(current)) {
    const owner = unwrapExpression(graph, model, current.expression, candidate)
    if (!ts.isObjectLiteralExpression(owner.expression)) {
      throw new Error(`Не удалось разрешить ${current.getText()} в ${candidate}`)
    }
    return unwrapExpression(
      graph,
      owner.model,
      propertyInitializer(owner.expression, current.name.text, candidate),
      candidate
    )
  }
  return { model, expression: current }
}

function addXMLOrderReplacement(
  model: SourceModel,
  rule: ts.ObjectLiteralExpression,
  keys: readonly string[],
  candidate: string,
  replacements: Map<string, Map<string, TextReplacement>>
): void {
  const existing = namedProperty(rule, "xmlOrder", candidate)
  if (existing !== undefined) {
    if (!ts.isPropertyAssignment(existing)) {
      throw new Error(`${candidate}.xmlOrder должен быть property assignment`)
    }
    const indent = lineIndent(model.text, existing.getStart(model.sourceFile))
    addReplacement(replacements, model, {
      start: existing.initializer.getStart(model.sourceFile),
      end: existing.initializer.end,
      text: formatArray(keys, indent),
      candidate,
    })
    return
  }

  const properties = namedProperty(rule, "properties", candidate)
  if (properties === undefined) throw new Error(`Не найдено свойство properties в ${candidate}`)
  const start = properties.getStart(model.sourceFile)
  const indent = lineIndent(model.text, start)
  addReplacement(replacements, model, {
    start,
    end: start,
    text: `xmlOrder: ${formatArray(keys, indent)},\n${indent}`,
    candidate,
  })
}

function namedProperty(
  object: ts.ObjectLiteralExpression,
  name: string,
  candidate: string
): ts.ObjectLiteralElementLike | undefined {
  let result: ts.ObjectLiteralElementLike | undefined
  for (const element of object.properties) {
    if (element.name !== undefined && ts.isComputedPropertyName(element.name)) {
      throw new Error(`Вычисляемое computed-свойство не поддерживается в ${candidate}`)
    }
    if (element.name !== undefined && propertyName(element.name) === name) result = element
  }
  return result
}

function formatArray(keys: readonly string[], indent: string): string {
  if (keys.length === 0) return "[]"
  return `[\n${keys.map((key) => `${indent}  ${JSON.stringify(key)},`).join("\n")}\n${indent}]`
}

function lineIndent(text: string, position: number): string {
  const lineStart = text.lastIndexOf("\n", position - 1) + 1
  return text.slice(lineStart, position).match(/^\s*/)?.[0] ?? ""
}

function collectNumericOrderRemovals(params: {
  graph: SourceGraph
  model: SourceModel
  object: ts.ObjectLiteralExpression
  candidate: string
  ancestors: ReadonlySet<ts.ObjectLiteralExpression>
  replacements: Map<string, Map<string, TextReplacement>>
}): void {
  if (params.ancestors.has(params.object)) throw new Error(`Циклический spread в ${params.candidate}`)
  const ancestors = new Set(params.ancestors)
  ancestors.add(params.object)
  for (const element of params.object.properties) {
    if (ts.isSpreadAssignment(element)) {
      const spread = resolveObjectExpression(params.graph, params.model, element.expression, params.candidate)
      collectNumericOrderRemovals({ ...params, model: spread.model, object: spread.object, ancestors })
      continue
    }
    for (const range of orderRemovalRanges(element)) {
      addReplacement(params.replacements, params.model, {
        ...range,
        text: "",
        candidate: params.candidate,
      })
    }
  }
}

function orderRemovalRanges(element: ts.ObjectLiteralElementLike): { start: number; end: number }[] {
  if (!ts.isPropertyAssignment(element)) return []
  const objects: ts.ObjectLiteralExpression[] = []
  const initializer = unwrapSyntax(element.initializer)
  if (ts.isObjectLiteralExpression(initializer)) objects.push(initializer)
  if (ts.isCallExpression(initializer)) {
    for (const argument of initializer.arguments) {
      const unwrapped = unwrapSyntax(argument)
      if (ts.isObjectLiteralExpression(unwrapped)) objects.push(unwrapped)
    }
  }
  return objects.flatMap((object) =>
    object.properties.flatMap((property, index) => {
      if (
        !ts.isPropertyAssignment(property) ||
        ts.isComputedPropertyName(property.name) ||
        propertyName(property.name) !== "order" ||
        !ts.isNumericLiteral(unwrapSyntax(property.initializer))
      ) {
        return []
      }
      const next = object.properties[index + 1]
      const previous = object.properties[index - 1]
      if (next !== undefined) return [{ start: property.getStart(), end: next.getStart() }]
      if (previous !== undefined) return [{ start: previous.end, end: property.end }]
      return [{ start: property.getStart(), end: property.end }]
    })
  )
}

function expandObject(
  graph: SourceGraph,
  model: SourceModel,
  object: ts.ObjectLiteralExpression,
  candidate: string,
  ancestors: ReadonlySet<ts.ObjectLiteralExpression>
): { key: string; element: ts.ObjectLiteralElementLike }[] {
  if (ancestors.has(object)) throw new Error(`Циклический spread в ${candidate}`)
  const nestedAncestors = new Set(ancestors)
  nestedAncestors.add(object)
  const result: { key: string; element: ts.ObjectLiteralElementLike }[] = []
  const positions = new Map<string, number>()
  for (const element of object.properties) {
    if (ts.isSpreadAssignment(element)) {
      const spread = resolveObjectExpression(graph, model, element.expression, candidate)
      for (const entry of expandObject(graph, spread.model, spread.object, candidate, nestedAncestors)) {
        const position = positions.get(entry.key)
        if (position === undefined) {
          positions.set(entry.key, result.length)
          result.push(entry)
        } else {
          result[position] = entry
        }
      }
      continue
    }
    const key = elementKey(element, candidate)
    const position = positions.get(key)
    if (position === undefined) {
      positions.set(key, result.length)
      result.push({ key, element })
    } else {
      result[position] = { key, element }
    }
  }
  return result
}

function resolveObjectExpression(
  graph: SourceGraph,
  model: SourceModel,
  expression: ts.Expression,
  candidate: string
): { model: SourceModel; object: ts.ObjectLiteralExpression } {
  const resolved = unwrapExpression(graph, model, expression, candidate)
  if (!ts.isObjectLiteralExpression(resolved.expression)) {
    throw new Error(`Spread в ${candidate} не разрешается в локальный объектный литерал`)
  }
  return { model: resolved.model, object: resolved.expression }
}

function addReplacement(
  replacements: Map<string, Map<string, TextReplacement>>,
  model: SourceModel,
  replacement: TextReplacement
): void {
  const byRange = replacements.get(model.filePath) ?? new Map<string, TextReplacement>()
  const key = `${replacement.start}:${replacement.end}`
  const existing = byRange.get(key)
  if (existing !== undefined && existing.text !== replacement.text) {
    throw new Error(`Несовместимые изменения ${replacement.candidate} и ${existing.candidate}`)
  }
  byRange.set(key, replacement)
  replacements.set(model.filePath, byRange)
}

function assertNonOverlapping(replacements: readonly TextReplacement[], filePath: string): void {
  for (let index = 1; index < replacements.length; index += 1) {
    const previous = replacements[index - 1]!
    const current = replacements[index]!
    if (current.end > previous.start && !(current.start === current.end || previous.start === previous.end)) {
      throw new Error(`Пересекающиеся изменения в ${filePath}`)
    }
  }
}

function assertParses(filePath: string, text: string): void {
  const reparsed = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const diagnostics = (reparsed as ts.SourceFile & { parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics ?? []
  if (diagnostics.length > 0) throw new Error(`Переписанный ${filePath} содержит синтаксические ошибки`)
}

function unwrapSyntax(expression: ts.Expression): ts.Expression {
  let current = expression
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current) ||
    ts.isTypeAssertionExpression(current)
  ) {
    current = current.expression
  }
  return current
}

function elementKey(element: ts.ObjectLiteralElementLike, candidate: string): string {
  if (ts.isSpreadAssignment(element)) throw new Error(`Spread не является самостоятельным ключом в ${candidate}`)
  if (element.name === undefined || ts.isComputedPropertyName(element.name)) {
    throw new Error(`Вычисляемое computed-свойство не поддерживается в ${candidate}`)
  }
  return propertyName(element.name)
}

function propertyName(name: ts.PropertyName): string {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text
  throw new Error("Вычисляемое computed-свойство не поддерживается")
}

function bytewiseCompare(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left), Buffer.from(right))
}
