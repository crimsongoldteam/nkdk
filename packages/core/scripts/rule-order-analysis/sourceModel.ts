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
}

interface ObjectConstraint {
  object: ts.ObjectLiteralExpression
  keys: readonly string[]
  candidate: string
}

export async function buildRuleSourceEdits(params: {
  orders: readonly CanonicalRuleOrder[]
  readFile(path: string): Promise<string>
}): Promise<readonly RuleSourceEdit[]> {
  const ordersByFile = Map.groupBy(params.orders, (order) => order.source.filePath)
  const edits: RuleSourceEdit[] = []
  for (const [filePath, orders] of [...ordersByFile].sort(([left], [right]) => bytewiseCompare(left, right))) {
    const text = await params.readFile(filePath)
    const model = createSourceModel(filePath, text)
    const constraints = new Map<ts.ObjectLiteralExpression, ObjectConstraint>()
    for (const order of orders) {
      const exported = model.variables.get(order.source.exportName)
      if (exported === undefined) throw new Error(`Не найден экспорт ${order.source.candidate}`)
      const rule = resolvePath(model, exported, order.source.propertyPath, order.source.candidate)
      const properties = propertyObject(model, rule, "properties", order.source.candidate)
      constrainObject(model, properties, order.propertyKeys, order.source.candidate, constraints, new Set())
    }
    const updatedText = applyConstraints(model, constraints)
    const reparsed = ts.createSourceFile(filePath, updatedText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    const diagnostics = (reparsed as ts.SourceFile & { parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics ?? []
    if (diagnostics.length > 0) {
      throw new Error(`Переписанный ${filePath} содержит синтаксические ошибки`)
    }
    if (updatedText !== text) {
      edits.push({
        filePath,
        originalText: text,
        updatedText,
        candidates: orders.map((order) => order.source.candidate).sort(bytewiseCompare),
      })
    }
  }
  return edits
}

function createSourceModel(filePath: string, text: string): SourceModel {
  const sourceFile = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const variables = new Map<string, ts.Expression>()
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer !== undefined) {
        variables.set(declaration.name.text, declaration.initializer)
      }
    }
  }
  return { filePath, text, sourceFile, variables }
}

function resolvePath(
  model: SourceModel,
  expression: ts.Expression,
  path: readonly string[],
  candidate: string
): ts.Expression {
  let current = unwrapExpression(model, expression, candidate)
  for (const segment of path) {
    if (ts.isObjectLiteralExpression(current)) {
      current = unwrapExpression(model, propertyInitializer(current, segment, candidate), candidate)
      continue
    }
    if (ts.isArrayLiteralExpression(current)) {
      const index = Number(segment)
      if (!Number.isSafeInteger(index) || current.elements[index] === undefined) {
        throw new Error(`Не найден ${candidate}.${path.join(".")}`)
      }
      current = unwrapExpression(model, current.elements[index] as ts.Expression, candidate)
      continue
    }
    throw new Error(`Невозможно пройти путь ${candidate}.${path.join(".")}`)
  }
  return current
}

function propertyObject(
  model: SourceModel,
  expression: ts.Expression,
  name: string,
  candidate: string
): ts.ObjectLiteralExpression {
  const object = unwrapExpression(model, expression, candidate)
  if (!ts.isObjectLiteralExpression(object)) throw new Error(`${candidate} не является объектным литералом`)
  const value = unwrapExpression(model, propertyInitializer(object, name, candidate), candidate)
  if (!ts.isObjectLiteralExpression(value)) throw new Error(`${candidate}.${name} не является объектным литералом`)
  return value
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

function unwrapExpression(model: SourceModel, expression: ts.Expression, candidate: string): ts.Expression {
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
    if (resolved === undefined) throw new Error(`Не удалось разрешить ${current.text} в ${candidate}`)
    return unwrapExpression(model, resolved, candidate)
  }
  return current
}

function constrainObject(
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
  const expanded = expandObject(model, object, candidate, nextAncestors)
  const expandedKeys = expanded.map((entry) => entry.key)
  const expectedKeys = canonicalKeys.filter((key) => expandedKeys.includes(key))
  if (expectedKeys.length !== expandedKeys.length || expectedKeys.some((key, index) => key !== canonicalKeys[index])) {
    const missing = expandedKeys.filter((key) => !canonicalKeys.includes(key))
    if (missing.length > 0) throw new Error(`${candidate} не содержит порядок для: ${missing.join(", ")}`)
  }

  for (const element of object.properties) {
    if (!ts.isSpreadAssignment(element)) continue
    const spreadObject = resolveObjectExpression(model, element.expression, candidate)
    const spreadKeys = expandObject(model, spreadObject, candidate, nextAncestors).map((entry) => entry.key)
    constrainObject(
      model,
      spreadObject,
      canonicalKeys.filter((key) => spreadKeys.includes(key)),
      candidate,
      constraints,
      nextAncestors
    )
  }

  const directKeys = directInsertionKeys(model, object, candidate, nextAncestors)
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
  constraints.set(object, { object, keys, candidate })
}

function expandObject(
  model: SourceModel,
  object: ts.ObjectLiteralExpression,
  candidate: string,
  ancestors: ReadonlySet<ts.ObjectLiteralExpression>
): { key: string; element: ts.ObjectLiteralElementLike }[] {
  const result: { key: string; element: ts.ObjectLiteralElementLike }[] = []
  const positions = new Map<string, number>()
  for (const element of object.properties) {
    if (ts.isSpreadAssignment(element)) {
      const spread = resolveObjectExpression(model, element.expression, candidate)
      if (ancestors.has(spread)) throw new Error(`Циклический spread в ${candidate}`)
      const nestedAncestors = new Set(ancestors)
      nestedAncestors.add(spread)
      for (const entry of expandObject(model, spread, candidate, nestedAncestors)) {
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
  model: SourceModel,
  object: ts.ObjectLiteralExpression,
  candidate: string,
  ancestors: ReadonlySet<ts.ObjectLiteralExpression>
): { element: ts.ObjectLiteralElementLike; keys: string[] }[] {
  const seen = new Set<string>()
  return object.properties.map((element) => {
    const keys = ts.isSpreadAssignment(element)
      ? expandObject(model, resolveObjectExpression(model, element.expression, candidate), candidate, ancestors).map(
          (entry) => entry.key
        )
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
  model: SourceModel,
  expression: ts.Expression,
  candidate: string
): ts.ObjectLiteralExpression {
  const resolved = unwrapExpression(model, expression, candidate)
  if (!ts.isObjectLiteralExpression(resolved)) {
    throw new Error(`Spread в ${candidate} не разрешается в локальный объектный литерал`)
  }
  return resolved
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
