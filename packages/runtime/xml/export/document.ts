import type {
  XmlAttributeNode,
  XmlContentNode,
  XmlDocument,
  XmlElementNode,
  XmlProcessingInstructionNode,
  XmlTextNode,
} from "../import/document"
import { hashXmlElementStructure, normalizeXmlElementContent } from "../structure/hash"
import { parseXmlProcessingInstructionAttributes } from "../structure/processingInstruction"
import { getXmlOrderedChildren, normalizeXmlObjectForExport } from "./exporter"

export interface XmlObjectDocumentResult {
  readonly document: XmlDocument
}

export function xmlObjectDocument(value: unknown): XmlObjectDocumentResult {
  const normalized = normalizeXmlObjectForExport(value)
  if (!isRecord(normalized)) throw new Error("Корень XML-объекта должен быть отображением")
  let nextId = 1
  const allocateId = (): number => nextId++
  const roots: XmlElementNode[] = []
  const counts = new Map<string, number>()
  for (const [name, child] of Object.entries(normalized)) {
    if (name.startsWith("?") || name.startsWith("_")) continue
    for (const item of repeatedValues(child)) {
      const occurrence = increment(counts, name)
      roots.push(elementNode(name, item, `/${name}[${occurrence}]`, occurrence, allocateId))
    }
  }
  return {
    document: {
      content: roots,
      roots,
      compatibility: normalized,
      sourceLength: 0,
    },
  }
}

function elementNode(
  name: string,
  value: unknown,
  path: string,
  occurrence: number,
  allocateId: () => number,
): XmlElementNode {
  const id = allocateId()
  const attributes = elementAttributes(value, path, allocateId)
  const content: XmlContentNode[] = []
  let textCount = 0
  const childCounts = new Map<string, number>()
  const children = isRecord(value)
    ? getXmlOrderedChildren(value)
      ?? Object.entries(value)
        .filter(([key]) => key !== "#text" && !key.startsWith("_"))
        .map(([key, child]) => ({ key, value: child }))
    : []
  const hasText = isRecord(value) && value["#text"] !== undefined
  const containsInstruction = children.some(({ key }) => key.startsWith("?"))
  if (hasText) {
    const text = String(value["#text"])
    appendText(children.length === 0 ? text : `\n${text}\t`)
  } else if (!isRecord(value) && value !== undefined && value !== null && value !== "") {
    appendText(String(value))
  } else if (containsInstruction) {
    appendText("\n\t")
  }
  for (const child of children) {
    for (const item of repeatedValues(child.value)) {
      const childOccurrence = increment(childCounts, child.key)
      const childPath = `${path}/${child.key}[${childOccurrence}]`
      content.push(child.key.startsWith("?")
        ? processingInstructionNode(child.key.slice(1), item, childPath, childOccurrence, allocateId)
        : elementNode(child.key, item, childPath, childOccurrence, allocateId))
    }
  }
  if ((hasText && children.length > 0) || containsInstruction) appendText("\n")
  const normalizedContent = normalizeXmlElementContent(content) as XmlContentNode[]
  const partial = {
    type: "element" as const,
    id,
    name,
    occurrence,
    path,
    attributes,
    content: normalizedContent,
    span: syntheticSpan(),
    compatibilityValue: value,
  }
  return { ...partial, structuralHash: hashXmlElementStructure(partial) }

  function appendText(text: string): void {
    textCount += 1
    const node: XmlTextNode = {
      type: "text",
      id: allocateId(),
      occurrence: textCount,
      path: `${path}/#text[${textCount}]`,
      span: syntheticSpan(),
      value: text,
    }
    content.push(node)
  }
}

function elementAttributes(
  value: unknown,
  path: string,
  allocateId: () => number,
): XmlAttributeNode[] {
  if (!isRecord(value)) return []
  const counts = new Map<string, number>()
  return Object.entries(value).flatMap(([key, attribute]) => {
    if (!key.startsWith("_")) return []
    const name = key.slice(1)
    const occurrence = increment(counts, name)
    return [{
      id: allocateId(),
      name,
      occurrence,
      path: `${path}/@${name}[${occurrence}]`,
      span: syntheticSpan(),
      value: String(attribute),
    }]
  })
}

function processingInstructionNode(
  target: string,
  _value: unknown,
  path: string,
  occurrence: number,
  allocateId: () => number,
): XmlProcessingInstructionNode {
  const body = ""
  const attributes = parseXmlProcessingInstructionAttributes(body).map(({ name, value }, index) => ({
    id: allocateId(),
    name,
    occurrence: index + 1,
    path: `${path}/@${name}[${index + 1}]`,
    span: syntheticSpan(),
    value,
  }))
  return {
    type: "processingInstruction",
    id: allocateId(),
    target,
    occurrence,
    path,
    body,
    attributes,
    span: syntheticSpan(),
  }
}

function repeatedValues(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : value === undefined ? [] : [value]
}

function increment(counts: Map<string, number>, key: string): number {
  const value = (counts.get(key) ?? 0) + 1
  counts.set(key, value)
  return value
}

function syntheticSpan() {
  return { start: 0, end: 0 }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
