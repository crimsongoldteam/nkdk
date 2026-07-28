import { dirname, extname, resolve } from "node:path"
import ts from "typescript"
import type { CanonicalRuleOrder } from "../../metadata/ruleOrderAnalysis/canonicalOrder"

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

interface ObjectConstraint {
  model: SourceModel
  object: ts.ObjectLiteralExpression
  keys: readonly string[]
  candidate: string
}

export async function buildRuleSourceEdits(params: {
  orders: readonly CanonicalRuleOrder[]
  readFile(path: string): Promise<string>
}): Promise<readonly RuleSourceEdit[]> {
  const graph: SourceGraph = { models: new Map() }
  for (const order of params.orders) {
    await loadSourceModel(graph, order.source.filePath, params.readFile)
  }

  const constraints = new Map<ts.ObjectLiteralExpression, ObjectConstraint>()
  const candidatesByFile = new Map<string, Set<string>>()
  for (const order of params.orders) {
    const model = graph.models.get(order.source.filePath)
    if (model === undefined) throw new Error(`Не загружен ${order.source.filePath}`)
    const exported = model.variables.get(order.source.exportName)
    if (exported === undefined) throw new Error(`Не найден экспорт ${order.source.candidate}`)
    const resolvedRule = resolvePath(graph, model, exported, order.source.propertyPath, order.source.candidate)
    const properties = propertyObject(graph, resolvedRule, "properties", order.source.candidate)
    constrainObject(
      graph,
      properties.model,
      properties.object,
      order.propertyKeys,
      order.source.candidate,
      constraints,
      new Set()
    )
  }

  const edits: RuleSourceEdit[] = []
  const constraintsByFile = Map.groupBy([...constraints.values()], (constraint) => constraint.model.filePath)
  for (const [filePath, fileConstraints] of [...constraintsByFile].sort(([left], [right]) =>
    bytewiseCompare(left, right)
  )) {
    const model = graph.models.get(filePath)
    if (model === undefined) throw new Error(`Не загружен ${filePath}`)
    for (const constraint of fileConstraints) {
      const candidates = candidatesByFile.get(filePath) ?? new Set<string>()
      candidates.add(constraint.candidate)
      candidatesByFile.set(filePath, candidates)
    }
    const updatedText = applyConstraints(model, new Map(fileConstraints.map((constraint) => [constraint.object, constraint])))
    const reparsed = ts.createSourceFile(filePath, updatedText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    const diagnostics = (reparsed as ts.SourceFile & { parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics ?? []
    if (diagnostics.length > 0) {
      throw new Error(`Переписанный ${filePath} содержит синтаксические ошибки`)
    }
    if (updatedText !== model.text) {
      edits.push({
        filePath,
        originalText: model.text,
        updatedText,
        candidates: [...(candidatesByFile.get(filePath) ?? [])].sort(bytewiseCompare),
      })
    }
  }
  return edits
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
  resolved: { model: SourceModel; expression: ts.Expression },
  name: string,
  candidate: string
): { model: SourceModel; object: ts.ObjectLiteralExpression } {
  const object = unwrapExpression(graph, resolved.model, resolved.expression, candidate)
  if (!ts.isObjectLiteralExpression(object.expression)) {
    throw new Error(`${candidate} не является объектным литералом`)
  }
  const value = unwrapExpression(
    graph,
    object.model,
    propertyInitializer(object.expression, name, candidate),
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
  let current = expression
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current) ||
    ts.isTypeAssertionExpression(current)
  ) {
    current = current.expression
  }
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

function constrainObject(
  graph: SourceGraph,
  model: SourceModel,
  object: ts.ObjectLiteralExpression,
  canonicalKeys: readonly string[],
  candidate: string,
  constraints: Map<ts.ObjectLiteralExpression, ObjectConstraint>,
  ancestors: ReadonlySet<ts.ObjectLiteralExpression>
): void {
  if (ancestors.has(object)) throw new Error(`Циклический spread в ${candidate}`)
  const nextAncestors = new Set(ancestors)
  nextAncestors.add(object)
  const expanded = expandObject(graph, model, object, candidate, nextAncestors)
  const expandedKeys = expanded.map((entry) => entry.key)
  const expectedKeys = canonicalKeys.filter((key) => expandedKeys.includes(key))
  if (expectedKeys.length !== expandedKeys.length || expectedKeys.some((key, index) => key !== canonicalKeys[index])) {
    const missing = expandedKeys.filter((key) => !canonicalKeys.includes(key))
    if (missing.length > 0) throw new Error(`${candidate} не содержит порядок для: ${missing.join(", ")}`)
  }

  for (const element of object.properties) {
    if (!ts.isSpreadAssignment(element)) continue
    const spread = resolveObjectExpression(graph, model, element.expression, candidate)
    const spreadKeys = expandObject(graph, spread.model, spread.object, candidate, nextAncestors).map(
      (entry) => entry.key
    )
    constrainObject(
      graph,
      spread.model,
      spread.object,
      canonicalKeys.filter((key) => spreadKeys.includes(key)),
      candidate,
      constraints,
      nextAncestors
    )
  }

  const directKeys = directInsertionKeys(graph, model, object, candidate, nextAncestors)
  const hasSpread = object.properties.some(ts.isSpreadAssignment)
  const hasOverride = directKeys.some((entry) => entry.keys.length === 0)
  if (hasSpread || hasOverride) {
    assertCompositionIsProvable(directKeys, canonicalKeys, candidate)
    return
  }
  const keys = canonicalKeys.filter((key) => expandedKeys.includes(key))
  const existing = constraints.get(object)
  if (existing !== undefined && JSON.stringify(existing.keys) !== JSON.stringify(keys)) {
    throw new Error(`Несовместимые потребители общего fragment в ${candidate}: ${existing.candidate}`)
  }
  constraints.set(object, { model, object, keys, candidate })
}

function expandObject(
  graph: SourceGraph,
  model: SourceModel,
  object: ts.ObjectLiteralExpression,
  candidate: string,
  ancestors: ReadonlySet<ts.ObjectLiteralExpression>
): { key: string; element: ts.ObjectLiteralElementLike }[] {
  const result: { key: string; element: ts.ObjectLiteralElementLike }[] = []
  const positions = new Map<string, number>()
  for (const element of object.properties) {
    if (ts.isSpreadAssignment(element)) {
      const spread = resolveObjectExpression(graph, model, element.expression, candidate)
      if (ancestors.has(spread.object)) throw new Error(`Циклический spread в ${candidate}`)
      const nestedAncestors = new Set(ancestors)
      nestedAncestors.add(spread.object)
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

function directInsertionKeys(
  graph: SourceGraph,
  model: SourceModel,
  object: ts.ObjectLiteralExpression,
  candidate: string,
  ancestors: ReadonlySet<ts.ObjectLiteralExpression>
): { element: ts.ObjectLiteralElementLike; keys: string[] }[] {
  const seen = new Set<string>()
  return object.properties.map((element) => {
    const keys = ts.isSpreadAssignment(element)
      ? (() => {
          const spread = resolveObjectExpression(graph, model, element.expression, candidate)
          return expandObject(graph, spread.model, spread.object, candidate, ancestors).map((entry) => entry.key)
        })()
      : [elementKey(element, candidate)]
    const inserted = keys.filter((key) => {
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    return { element, keys: inserted }
  })
}

function assertCompositionIsProvable(
  entries: readonly { keys: readonly string[] }[],
  canonicalKeys: readonly string[],
  candidate: string
): void {
  const owners = new Map<string, number>()
  entries.forEach((entry, index) => entry.keys.forEach((key) => owners.set(key, index)))
  const sequence = canonicalKeys.flatMap((key) => {
    const owner = owners.get(key)
    return owner === undefined ? [] : [owner]
  })
  const compact = sequence.filter((owner, index) => index === 0 || sequence[index - 1] !== owner)
  if (new Set(compact).size !== compact.length) {
    throw new Error(`Недоказуемая spread-композиция в ${candidate}`)
  }
  const current = entries.flatMap((entry, index) => (entry.keys.length === 0 ? [] : [index]))
  if (JSON.stringify(compact) !== JSON.stringify(current)) {
    throw new Error(`Недоказуемая перестановка spread-композиции в ${candidate}`)
  }
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

function applyConstraints(
  model: SourceModel,
  constraints: ReadonlyMap<ts.ObjectLiteralExpression, ObjectConstraint>
): string {
  const replacements = [...constraints.values()]
    .map((constraint) => objectReplacement(model, constraint))
    .sort((left, right) => right.start - left.start)
  let text = model.text
  for (const replacement of replacements) {
    text = text.slice(0, replacement.start) + replacement.text + text.slice(replacement.end)
  }
  return text
}

function objectReplacement(
  model: SourceModel,
  constraint: ObjectConstraint
): { start: number; end: number; text: string } {
  const elementsByKey = new Map(
    constraint.object.properties.map((element) => [elementKey(element, constraint.candidate), element])
  )
  const ordered = constraint.keys.map((key) => {
    const element = elementsByKey.get(key)
    if (element === undefined) throw new Error(`Не найден ключ ${key} в ${constraint.candidate}`)
    return element
  })
  if (ordered.length === 0) {
    return { start: constraint.object.getStart(model.sourceFile) + 1, end: constraint.object.end - 1, text: "" }
  }
  const first = constraint.object.properties[0]!
  const last = constraint.object.properties.at(-1)!
  return {
    start: first.getFullStart(),
    end: last.end,
    text: ordered.map((element) => propertySegment(model, element)).join(","),
  }
}

function propertySegment(model: SourceModel, element: ts.ObjectLiteralElementLike): string {
  const start = element.getFullStart()
  let segment = model.text.slice(start, element.end)
  const removals = orderRemovalRanges(element)
    .map((range) => ({ start: range.start - start, end: range.end - start }))
    .sort((left, right) => right.start - left.start)
  for (const removal of removals) {
    segment = segment.slice(0, removal.start) + segment.slice(removal.end)
  }
  return segment
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
  return objects.flatMap((object) => {
    const index = object.properties.findIndex(
      (property) =>
        ts.isPropertyAssignment(property) &&
        !ts.isComputedPropertyName(property.name) &&
        propertyName(property.name) === "order"
    )
    if (index < 0) return []
    const property = object.properties[index]!
    const next = object.properties[index + 1]
    const previous = object.properties[index - 1]
    if (next !== undefined) return [{ start: property.getStart(), end: next.getStart() }]
    if (previous !== undefined) return [{ start: previous.end, end: property.end }]
    return [{ start: property.getStart(), end: property.end }]
  })
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
