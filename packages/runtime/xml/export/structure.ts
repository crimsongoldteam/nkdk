import type { XmlRootStructure } from "../import/saxesParser"
import {
  hashXmlElementStructure,
  normalizeXmlElementContent,
  type XmlStructuralContent,
} from "../structure/hash"
import { getXmlOrderedChildren, normalizeXmlObjectForExport } from "./exporter"

export type XmlRootFingerprint = Pick<XmlRootStructure, "name" | "path" | "structuralHash">

export type XmlObjectStructureResult =
  | { readonly kind: "supported"; readonly roots: readonly XmlRootFingerprint[] }
  | { readonly kind: "unsupported"; readonly reason: string }

export function xmlObjectRootStructures(value: unknown): XmlObjectStructureResult {
  if (!isRecord(value)) return { kind: "unsupported", reason: "root-not-mapping" }
  const normalized = normalizeXmlObjectForExport(value)
  if (!isRecord(normalized)) return { kind: "unsupported", reason: "root-not-mapping" }
  if (containsProcessingInstruction(normalized)) return { kind: "unsupported", reason: "processing-instruction" }
  if (containsMixedContent(normalized)) return { kind: "unsupported", reason: "mixed-content" }
  const roots: XmlRootFingerprint[] = []
  const counts = new Map<string, number>()
  for (const [name, child] of Object.entries(normalized)) {
    for (const item of repeatedValues(child)) {
      const occurrence = (counts.get(name) ?? 0) + 1
      counts.set(name, occurrence)
      roots.push({ name, path: `/${name}[${occurrence}]`, structuralHash: elementHash(name, item) })
    }
  }
  return { kind: "supported", roots }
}

function elementHash(name: string, value: unknown): bigint {
  const attributes = isRecord(value)
    ? Object.entries(value)
        .filter(([key]) => key.startsWith("_"))
        .map(([key, attribute]) => ({ name: key.slice(1), value: String(attribute) }))
    : []
  const content: XmlStructuralContent[] = []
  if (isRecord(value) && value["#text"] !== undefined) {
    content.push({ type: "text", value: String(value["#text"]) })
  } else if (!isRecord(value) && value !== undefined && value !== null && value !== "") {
    content.push({ type: "text", value: String(value) })
  }
  const children = isRecord(value)
    ? getXmlOrderedChildren(value)
      ?? Object.entries(value)
        .filter(([key]) => key !== "#text" && !key.startsWith("_"))
        .map(([key, child]) => ({ key, value: child }))
    : []
  for (const child of children) {
    for (const item of repeatedValues(child.value)) {
      content.push({ type: "element", structuralHash: elementHash(child.key, item) })
    }
  }
  return hashXmlElementStructure({ name, attributes, content: normalizeXmlElementContent(content) })
}

function repeatedValues(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : value === undefined ? [] : [value]
}

function containsProcessingInstruction(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsProcessingInstruction)
  if (!isRecord(value)) return false
  return Object.entries(value).some(([key, child]) => key.startsWith("?") || containsProcessingInstruction(child))
}

function containsMixedContent(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsMixedContent)
  if (!isRecord(value)) return false
  const hasText = value["#text"] !== undefined
  const hasChildren = getXmlOrderedChildren(value)?.length
    || Object.keys(value).some((key) => key !== "#text" && !key.startsWith("_") && !key.startsWith("?"))
  if (hasText && hasChildren) return true
  return Object.entries(value).some(
    ([key, child]) => key !== "#text" && !key.startsWith("_") && containsMixedContent(child),
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
