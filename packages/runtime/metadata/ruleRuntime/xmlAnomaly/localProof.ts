import type { XmlAddressedNode, XmlAttributeNode, XmlContentNode, XmlElementNode } from "../../../xml/import/document"
import type { XmlStructureDifference } from "../../../xml/structure/compare"
import { normalizeXmlElementContent } from "../../../xml/structure/hash"

export const LOCAL_XML_BOUNDARY = Symbol("localXmlBoundary")

export function markLocalXmlBoundary<T extends object>(value: T): T {
  Object.defineProperty(value, LOCAL_XML_BOUNDARY, { value: true })
  return value
}

export function isLocalXmlBoundary(value: unknown): value is object {
  return value !== null && typeof value === "object"
    && (value as { readonly [LOCAL_XML_BOUNDARY]?: true })[LOCAL_XML_BOUNDARY] === true
}

/** Дочерний XML уже проверен; родителю передаётся только его структурный вклад. */
export interface LocalXmlChild {
  readonly type: "element"
  readonly name: string
  readonly occurrence: number
  readonly sourceId?: number
}

export type LocalXmlScalar = { readonly value: string; readonly sourceId?: never }
  | { readonly sourceId: number; readonly value?: never }

export type LocalXmlAttribute = LocalXmlScalar & {
  readonly name: string
  readonly occurrence?: number
}

export type LocalXmlContent = LocalXmlChild
  | ({ readonly type: "text" } & LocalXmlScalar)
  | {
    readonly type: "processingInstruction"
    readonly target: string
    readonly body: string
    readonly attributes?: readonly LocalXmlAttribute[]
  }

export interface LocalXmlShape {
  readonly name: string
  readonly attributes?: readonly LocalXmlAttribute[]
  readonly content?: readonly LocalXmlContent[]
}

const COMPARED = 1
const DIFFERENT = 2
const FINISHED = 4
const STARTED = 8
const EXACT: readonly XmlStructureDifference[] = Object.freeze([])

export function createLocalXmlProof(instrumentation?: {
  readonly onValue?: (node: XmlAddressedNode) => void
}) {
  // Массив растёт по уже существующим ID, не требует обхода документа для индексации.
  let states = new Uint8Array(64)
  const state = (node: XmlAddressedNode): number => states[node.id] ?? 0
  const mark = (node: XmlAddressedNode, flags: number): void => {
    if (node.id >= states.length) {
      const expanded = new Uint8Array(2 ** Math.ceil(Math.log2(node.id + 1)))
      expanded.set(states)
      states = expanded
    }
    states[node.id] = flags
  }
  const valueDifference = (
    source: XmlAddressedNode & { readonly value: string }, actual: LocalXmlScalar,
    ownerPath: string, differences: XmlStructureDifference[],
  ): void => {
    if (actual.sourceId !== undefined) {
      if (actual.sourceId !== source.id || (state(source) & FINISHED) === 0) {
        throw new Error(`Значение XML ещё не проверено: ${source.path}`)
      }
      return
    }
    if (state(source) !== 0) throw new Error(`Повторная проверка XML-значения: ${source.path}`)
    instrumentation?.onValue?.(source)
    if (source.value !== actual.value) differences.push({ kind: "value", path: source.path, ownerPath })
    mark(source, COMPARED | FINISHED)
  }
  const attributes = (
    source: readonly XmlAttributeNode[], actual: readonly LocalXmlAttribute[],
    ownerPath: string, differences: XmlStructureDifference[],
  ): void => {
    const occurrences = new Map<string, number>()
    const actualByKey = new Map<string, LocalXmlAttribute>(actual.map((attribute) => {
      const occurrence = attribute.occurrence ?? (occurrences.get(attribute.name) ?? 0) + 1
      occurrences.set(attribute.name, occurrence)
      return [`${attribute.name}[${occurrence}]`, attribute] as const
    }))
    if (actualByKey.size !== actual.length) throw new Error(`Повторный структурный вклад XML: ${ownerPath}/#attributes`)
    const expectedKeys = source.map((attribute) => `${attribute.name}[${attribute.occurrence}]`)
    // Обычная поправка добавляет отсутствующие атрибуты в конец. Учитываем
    // их будущие позиции здесь, при единственной проверке порядка, иначе
    // восстановление первого атрибута могло бы незаметно переставить его.
    const restoredKeys = [...actualByKey.keys()]
    for (const key of expectedKeys) if (!actualByKey.has(key)) restoredKeys.push(key)
    compareOrder(expectedKeys, restoredKeys, ownerPath, differences, `${ownerPath}/#attributes/#order`)
    for (const attribute of source) {
      const key = `${attribute.name}[${attribute.occurrence}]`
      const counterpart = actualByKey.get(key)
      if (counterpart === undefined) differences.push({ kind: "presence", path: attribute.path, ownerPath })
      else valueDifference(attribute, counterpart, ownerPath, differences)
      actualByKey.delete(key)
    }
    for (const [key] of actualByKey) differences.push({ kind: "presence", path: `${ownerPath}/@${key}`, ownerPath })
  }
  const compare = (source: XmlElementNode, actual: LocalXmlShape): readonly XmlStructureDifference[] => {
    if (state(source) !== 0) throw new Error(`Повторная проверка XML: ${source.path}`)
    mark(source, STARTED)
    // Большинство XML-свойств — скаляры: не создаём карты и списки порядка для них.
    if (source.name === actual.name && source.attributes.length === 0 && !actual.attributes?.length) {
      const content = actual.content ?? []
      if (source.content.length === 0 && content.length === 0) {
        mark(source, COMPARED)
        return EXACT
      }
      const expectedText = source.content[0]
      const actualText = content[0]
      if (source.content.length === 1 && content.length === 1 && expectedText?.type === "text" && actualText?.type === "text" && actualText.sourceId === undefined) {
        if (state(expectedText) !== 0) throw new Error(`Повторная проверка XML-значения: ${expectedText.path}`)
        instrumentation?.onValue?.(expectedText)
        const differs = expectedText.value !== actualText.value
        mark(expectedText, COMPARED | FINISHED)
        mark(source, COMPARED | (differs ? DIFFERENT : 0))
        return differs ? [{ kind: "value", path: expectedText.path, ownerPath: source.path }] : EXACT
      }
    }
    const differences: XmlStructureDifference[] = []
    if (source.name !== actual.name) differences.push({ kind: "presence", path: source.path, ownerPath: source.path })
    if (source.attributes.length > 0 || actual.attributes?.length) {
      attributes(source.attributes, actual.attributes ?? [], source.path, differences)
    }
    const sourceContent = normalizeXmlElementContent(source.content)
    const counts = new Map<string, number>()
    const actualEntries = (actual.content ?? []).map((content) => {
      const kind = content.type === "element" ? content.name
        : content.type === "text" ? "#text" : `?${content.target}`
      const occurrence = content.type === "element" ? content.occurrence : (counts.get(kind) ?? 0) + 1
      counts.set(kind, occurrence)
      return { content, key: `${kind}[${occurrence}]` }
    })
    const actualByKey = new Map(actualEntries.map((entry) => [entry.key, entry.content]))
    if (actualByKey.size !== actualEntries.length) throw new Error(`Повторный структурный вклад XML: ${source.path}`)
    const expectedKeys: string[] = []
    const restoredKeys = actualEntries.map(({ key }) => key)
    for (const content of sourceContent) {
      const key = sourceContentKey(content)
      expectedKeys.push(key)
      const counterpart = actualByKey.get(key)
      if (counterpart === undefined) {
        differences.push({ kind: "presence", path: content.path, ownerPath: source.path })
        restoredKeys.push(key)
      } else if (content.type === "element" && counterpart.type === "element") {
        if (counterpart.sourceId !== content.id || (state(content) & FINISHED) === 0) {
          throw new Error(`Дочерний XML ещё не проверен: ${content.path}`)
        }
      } else if (content.type === "text" && counterpart.type === "text") {
        valueDifference(content, counterpart, source.path, differences)
      } else if (content.type === "processingInstruction" && counterpart.type === "processingInstruction") {
        if (state(content) !== 0) throw new Error(`Повторная проверка XML: ${content.path}`)
        instrumentation?.onValue?.(content)
        if (content.body !== counterpart.body) differences.push({ kind: "value", path: content.path, ownerPath: source.path })
        attributes(content.attributes, counterpart.attributes ?? [], content.path, differences)
        mark(content, COMPARED | FINISHED)
      } else {
        differences.push({ kind: "presence", path: content.path, ownerPath: source.path })
      }
      actualByKey.delete(key)
    }
    for (const [key] of actualByKey) differences.push({ kind: "presence", path: `${source.path}/${key}`, ownerPath: source.path })
    compareOrder(expectedKeys, restoredKeys, source.path, differences)
    mark(source, COMPARED | (differences.length === 0 ? 0 : DIFFERENT))
    return differences
  }
  const preserveRemaining = (node: XmlElementNode): void => {
    for (const attribute of node.attributes) mark(attribute, COMPARED | FINISHED)
    for (const content of node.content) {
      if ((state(content) & FINISHED) !== 0) continue
      if (content.type === "element") preserveRemaining(content)
      if (content.type === "processingInstruction") {
        for (const attribute of content.attributes) mark(attribute, COMPARED | FINISHED)
      }
      mark(content, COMPARED | FINISHED)
    }
  }
  const finish = (source: XmlElementNode, options?: { readonly annotated: true }): LocalXmlChild => {
    const flags = state(source)
    if ((flags & COMPARED) === 0) throw new Error(`XML не проверен: ${source.path}`)
    if ((flags & FINISHED) !== 0) throw new Error(`Повторное завершение XML: ${source.path}`)
    if ((flags & DIFFERENT) !== 0 && options?.annotated !== true) {
      throw new Error(`Не оформлены аномалии XML: ${source.path}`)
    }
    if (options?.annotated === true) preserveRemaining(source)
    mark(source, flags | FINISHED)
    return { type: "element", name: source.name, occurrence: source.occurrence, sourceId: source.id }
  }
  const checkValue = (
    source: XmlAddressedNode & { readonly value: string }, actual: string,
    annotate?: (difference: XmlStructureDifference) => void,
  ): { readonly sourceId: number } => {
    if (state(source) !== 0) throw new Error(`Повторная проверка XML-значения: ${source.path}`)
    mark(source, STARTED)
    instrumentation?.onValue?.(source)
    if (source.value !== actual) {
      if (annotate === undefined) throw new Error(`Не оформлена аномалия XML: ${source.path}`)
      annotate({ kind: "value", path: source.path, ownerPath: source.path.slice(0, source.path.lastIndexOf("/")) })
    }
    mark(source, COMPARED | FINISHED)
    return { sourceId: source.id }
  }
  const check = (
    source: XmlElementNode, actual: LocalXmlShape,
    annotate?: (differences: readonly XmlStructureDifference[]) => void,
  ): LocalXmlChild => {
    const differences = compare(source, actual)
    if (differences.length === 0) return finish(source)
    if (annotate === undefined) throw new Error(`Не оформлены аномалии XML: ${source.path}`)
    annotate(differences)
    return finish(source, { annotated: true })
  }
  const checkAbsent = (
    source: XmlElementNode,
    annotate: (difference: XmlStructureDifference) => void,
  ): LocalXmlChild => {
    if (state(source) !== 0) throw new Error(`Повторная проверка XML: ${source.path}`)
    mark(source, STARTED)
    annotate({ kind: "presence", path: source.path, ownerPath: source.path.slice(0, source.path.lastIndexOf("/")) })
    mark(source, COMPARED | DIFFERENT)
    return finish(source, { annotated: true })
  }
  const completed = (source: XmlElementNode): LocalXmlChild | undefined =>
    (state(source) & FINISHED) === 0
      ? undefined
      : { type: "element", name: source.name, occurrence: source.occurrence, sourceId: source.id }
  const accept = (source: XmlElementNode): LocalXmlChild => {
    if (state(source) !== 0) throw new Error(`Повторная проверка XML: ${source.path}`)
    preserveRemaining(source)
    mark(source, COMPARED | FINISHED)
    return { type: "element", name: source.name, occurrence: source.occurrence, sourceId: source.id }
  }
  return { compare, finish, checkValue, check, checkAbsent, completed, accept }
}

export type LocalXmlProof = ReturnType<typeof createLocalXmlProof>

function sourceContentKey(content: XmlContentNode): string {
  const kind = content.type === "element" ? content.name
    : content.type === "text" ? "#text" : `?${content.target}`
  return `${kind}[${content.occurrence}]`
}

function compareOrder(
  expected: readonly string[], actual: readonly string[], ownerPath: string,
  differences: XmlStructureDifference[],
  orderPath = `${ownerPath}/#order`,
): void {
  if (expected.length < 2 || actual.length < 2) return
  const expectedSet = new Set(expected)
  const actualSet = new Set(actual)
  const commonExpected = expected.filter((key) => actualSet.has(key))
  let position = 0
  for (const key of actual) {
    if (!expectedSet.has(key)) continue
    if (commonExpected[position++] !== key) {
      differences.push({ kind: "order", path: orderPath, ownerPath })
      return
    }
  }
}
