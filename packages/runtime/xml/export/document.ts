import type {
  XmlAttributeNode,
  XmlContentNode,
  XmlDocument,
  XmlElementNode,
  XmlProcessingInstructionNode,
  XmlTextNode,
} from "../import/document"
import {
  hashXmlElementStructure,
  normalizeXmlElementContent,
  type XmlStructuralContent,
} from "../structure/hash"
import { parseXmlProcessingInstructionAttributes } from "../structure/processingInstruction"
import { getXmlOrderedChildren, normalizeXmlObjectForExport } from "./exporter"

export interface XmlObjectDocumentResult {
  readonly document: XmlDocument
}

export interface XmlObjectRootFingerprint {
  readonly name: string
  readonly path: string
  readonly structuralHash: bigint
}

let xmlObjectDocumentBuildCountValueForTests = 0

export function xmlObjectDocumentBuildCountForTests(): number {
  return xmlObjectDocumentBuildCountValueForTests
}

export function resetXmlObjectDocumentBuildCountForTests(): void {
  xmlObjectDocumentBuildCountValueForTests = 0
}

export function xmlObjectDocument(value: unknown): XmlObjectDocumentResult {
  xmlObjectDocumentBuildCountValueForTests += 1
  const normalized = normalizedXmlRoot(value)
  let nextId = 1
  const allocateId = (): number => nextId++
  const roots: XmlElementNode[] = []
  for (const { name, item, path, occurrence } of xmlRootEntries(normalized)) {
    roots.push(elementNode(name, item, path, occurrence, allocateId))
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

export function xmlObjectRootFingerprints(value: unknown): readonly XmlObjectRootFingerprint[] {
  const normalized = normalizedXmlRoot(value)
  return xmlRootEntries(normalized).map(({ name, item, path }) => ({
    name,
    path,
    structuralHash: elementStructuralHash(name, item),
  }))
}

function xmlRootEntries(normalized: Record<string, unknown>) {
  const result: { name: string; item: unknown; path: string; occurrence: number }[] = []
  const counts = new Map<string, number>()
  for (const [name, child] of Object.entries(normalized)) {
    if (name.startsWith("?") || name.startsWith("_")) continue
    for (const item of repeatedValues(child)) {
      const occurrence = increment(counts, name)
      result.push({ name, item, path: `/${name}[${occurrence}]`, occurrence })
    }
  }
  return result
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
  for (const descriptor of contentDescriptors(value)) {
    if (descriptor.kind === "text") {
      appendText(descriptor.value)
      continue
    }
    const childOccurrence = increment(childCounts, descriptor.name)
    const childPath = `${path}/${descriptor.name}[${childOccurrence}]`
    content.push(descriptor.name.startsWith("?")
      ? processingInstructionNode(descriptor.name.slice(1), descriptor.value, childPath, childOccurrence, allocateId)
      : elementNode(descriptor.name, descriptor.value, childPath, childOccurrence, allocateId))
  }
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

function elementStructuralHash(name: string, value: unknown): bigint {
  const content = contentDescriptors(value).map((descriptor): XmlStructuralContent => {
    if (descriptor.kind === "text") return { type: "text", value: descriptor.value }
    if (descriptor.name.startsWith("?")) {
      return processingInstructionStructure(descriptor.name.slice(1))
    }
    return {
      type: "element",
      structuralHash: elementStructuralHash(descriptor.name, descriptor.value),
    }
  })
  return hashXmlElementStructure({
    name,
    attributes: structuralAttributes(value),
    content: normalizeXmlElementContent(content),
  })
}

type XmlObjectContentDescriptor =
  | { readonly kind: "text"; readonly value: string }
  | { readonly kind: "child"; readonly name: string; readonly value: unknown }

function contentDescriptors(value: unknown): XmlObjectContentDescriptor[] {
  const children = isRecord(value)
    ? getXmlOrderedChildren(value)
      ?? Object.entries(value)
        .filter(([key]) => key !== "#text" && !key.startsWith("_"))
        .map(([key, child]) => ({ key, value: child }))
    : []
  const result: XmlObjectContentDescriptor[] = []
  const hasText = isRecord(value)
    && value["#text"] !== undefined
    && value["#text"] !== null
    && String(value["#text"]).length > 0
  const containsInstruction = children.some(({ key }) => key.startsWith("?"))
  if (hasText) {
    const text = String(value["#text"])
    result.push({ kind: "text", value: children.length === 0 ? text : `\n${text}\t` })
  } else if (!isRecord(value) && value !== undefined && value !== null && value !== "") {
    result.push({ kind: "text", value: String(value) })
  } else if (containsInstruction) {
    result.push({ kind: "text", value: "\n\t" })
  }
  for (const child of children) {
    for (const item of repeatedValues(child.value)) {
      result.push({ kind: "child", name: child.key, value: item })
    }
  }
  if ((hasText && children.length > 0) || containsInstruction) {
    result.push({ kind: "text", value: "\n" })
  }
  return result
}

function elementAttributes(
  value: unknown,
  path: string,
  allocateId: () => number,
): XmlAttributeNode[] {
  if (!isRecord(value)) return []
  const counts = new Map<string, number>()
  return structuralAttributes(value).map(({ name, value: attribute }) => {
    const occurrence = increment(counts, name)
    return {
      id: allocateId(),
      name,
      occurrence,
      path: `${path}/@${name}[${occurrence}]`,
      span: syntheticSpan(),
      value: attribute,
    }
  })
}

function structuralAttributes(value: unknown): { readonly name: string; readonly value: string }[] {
  if (!isRecord(value)) return []
  return Object.entries(value).flatMap(([key, attribute]) =>
    key.startsWith("_") ? [{ name: key.slice(1), value: String(attribute) }] : []
  )
}

function processingInstructionNode(
  target: string,
  _value: unknown,
  path: string,
  occurrence: number,
  allocateId: () => number,
): XmlProcessingInstructionNode {
  const structure = processingInstructionStructure(target)
  const attributes = structure.attributes.map(({ name, value }, index) => ({
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
    body: structure.body,
    attributes,
    span: syntheticSpan(),
  }
}

function processingInstructionStructure(target: string) {
  const body = ""
  return {
    type: "processingInstruction" as const,
    target,
    body,
    attributes: parseXmlProcessingInstructionAttributes(body),
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

function normalizedXmlRoot(value: unknown): Record<string, unknown> {
  const normalized = normalizeXmlObjectForExport(value)
  if (!isRecord(normalized)) throw new Error("Корень XML-объекта должен быть отображением")
  return normalized
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
