import type {
  XmlElementNode,
  XmlProcessingInstructionNode,
  XmlTextNode,
} from "../../../xml/import/document"
import type { XmlRawValue } from "../../../xml/structure/rawCodec"
import {
  appendXmlAnnotatedMappingEntry,
  type XmlAnomalyAnnotationTable,
  xmlAnnotatedMappingEntries,
} from "../../../yaml/xmlAnomalyAnnotations"
import type {
  XmlImportAuditBoundary,
  XmlImportAuditedNode,
  XmlImportAuditSession,
  XmlImportAuditState,
} from "./importAudit"

export interface NamedXmlCollectionEntry<T = unknown> {
  readonly key: string
  readonly value: T
  readonly invalid?: boolean
}

export function projectNamedXmlCollection<T>(params: {
  readonly entries: readonly NamedXmlCollectionEntry<T>[]
  readonly annotations: XmlAnomalyAnnotationTable
}): Record<string, T> {
  const projected: Record<string, T> = {}
  const occurrences = new Map<string, number>()
  const annotatedOccurrences = new Map<string, number>()
  for (const entry of params.entries) {
    const occurrence = (occurrences.get(entry.key) ?? 0) + 1
    occurrences.set(entry.key, occurrence)
    const annotated = entry.invalid === true || occurrence > 1
    const annotationOccurrence = annotated
      ? (annotatedOccurrences.get(entry.key) ?? 0) + 1
      : undefined
    if (annotationOccurrence !== undefined) {
      annotatedOccurrences.set(entry.key, annotationOccurrence)
    }
    appendXmlAnnotatedMappingEntry(projected, params.annotations, {
      logicalKey: entry.key,
      value: entry.value,
      ...(annotationOccurrence === undefined
        ? {}
        : {
            keyAnnotation: {
              kind: "invalid" as const,
              occurrence: annotationOccurrence,
            },
          }),
    })
  }
  return projected
}

export function projectXmlAuditRemainder(params: {
  readonly yaml: Record<string, unknown>
  readonly annotations: XmlAnomalyAnnotationTable
  readonly audit: XmlImportAuditSession
  readonly root: XmlElementNode
  readonly boundary: XmlImportAuditBoundary
}): void {
  const outcomes = new Map(
    params.audit.outcomes().map((outcome) => [outcome.node, outcome.state] as const),
  )
  if (!outcomes.has(params.root)) {
    throw new Error(`XML-корень ${params.root.path} не принадлежит сеансу аудита`)
  }
  const existingKeys = new Set(
    xmlAnnotatedMappingEntries(params.yaml, params.annotations).map(([key]) => key),
  )
  const projectedKeys = new Map<string, number>()

  const appendRaw = (path: string, value: unknown): void => {
    if (existingKeys.has(path)) {
      throw new Error(`Raw XML-путь ${path} пересекается с обычной YAML-границей`)
    }
    const previous = projectedKeys.get(path) ?? 0
    projectedKeys.set(path, previous + 1)
    appendXmlAnnotatedMappingEntry(params.yaml, params.annotations, {
      logicalKey: path,
      value,
      ...(previous === 0
        ? {}
        : {
            keyAnnotation: {
              kind: "invalid" as const,
              occurrence: previous,
            },
          }),
      valueAnnotation: { kind: "raw", occurrence: 1 },
    })
  }

  const visitKnownElement = (element: XmlElementNode, path: readonly string[]): void => {
    const unknownAttributes = element.attributes.filter((attribute) =>
      isUnknown(outcomes.get(attribute)),
    )
    if (unknownAttributes.length > 0) {
      const value: Record<string, unknown> = {}
      for (const attribute of unknownAttributes) value[`_${attribute.name}`] = attribute.value
      if (unknownAttributes.length !== element.attributes.length) {
        value["#order"] = element.attributes.map(({ name }) => `_${name}`)
      }
      appendRaw(terminalPath(path, "#attributes"), value)
      for (const attribute of unknownAttributes) params.audit.claim(attribute, params.boundary)
    }

    const unknownText = element.content.filter(
      (node): node is XmlTextNode =>
        node.type === "text" && isUnknown(outcomes.get(node)) && node.value.trim() !== "",
    )
    if (unknownText.length > 0) {
      throw new Error(
        `Raw XML-граница ${formatPath(path)} пересекается с известной XML-границей: неизвестный #text`,
      )
    }
    for (const node of element.content) {
      if (node.type === "text" && isUnknown(outcomes.get(node)) && node.value.trim() === "") {
        params.audit.claim(node, params.boundary)
      }
    }

    const contentChildren = element.content.filter(
      (node): node is XmlElementNode | XmlProcessingInstructionNode => node.type !== "text",
    )
    const knownElementNames = new Set(
      contentChildren.flatMap((child) =>
        child.type === "element" && !isUnknown(outcomes.get(child)) ? [child.name] : [],
      ),
    )
    let hasUnknownChild = false
    let hasKnownChild = false
    for (const child of contentChildren) {
      const state = outcomes.get(child)
      if (isUnknown(state)) {
        hasUnknownChild = true
        if (child.type === "processingInstruction") {
          throw new Error(
            `Raw XML-граница ${formatPath(path)} пересекается с известной XML-границей: processing instruction`,
          )
        }
        if (knownElementNames.has(child.name)) {
          throw new Error(
            `XML-путь ${formatPath([...path, child.name])} уже принадлежит известной XML-границе`,
          )
        }
        assertRawSubtreeDoesNotOverlap(child, outcomes)
        appendRaw(formatPath([...path, child.name]), xmlElementRawValue(child))
        claimUnknownSubtree(child, outcomes, params.audit, params.boundary)
        continue
      }
      hasKnownChild = true
      if (child.type === "element") visitKnownElement(child, [...path, child.name])
    }
    if (hasUnknownChild && hasKnownChild) {
      appendRaw(
        terminalPath(path, "#order"),
        contentChildren.map((child) =>
          child.type === "element" ? child.name : `?${child.target}`,
        ),
      )
    }
  }

  if (isUnknown(outcomes.get(params.root))) {
    throw new Error(`Ближайший YAML-владелец не заявил XML-корень ${params.root.path}`)
  }
  visitKnownElement(params.root, [])
}

function assertRawSubtreeDoesNotOverlap(
  root: XmlElementNode,
  outcomes: ReadonlyMap<XmlImportAuditedNode, XmlImportAuditState>,
): void {
  for (const node of subtree(root)) {
    if (!isUnknown(outcomes.get(node))) {
      throw new Error(
        `Raw XML-граница ${root.path} пересекается с известной XML-границей ${node.path}`,
      )
    }
  }
}

function claimUnknownSubtree(
  root: XmlElementNode,
  outcomes: ReadonlyMap<XmlImportAuditedNode, XmlImportAuditState>,
  audit: XmlImportAuditSession,
  boundary: XmlImportAuditBoundary,
): void {
  for (const node of subtree(root)) {
    if (isUnknown(outcomes.get(node))) audit.claim(node, boundary)
  }
}

function subtree(root: XmlElementNode): XmlImportAuditedNode[] {
  const result: XmlImportAuditedNode[] = [root, ...root.attributes]
  for (const node of root.content) {
    result.push(node)
    if (node.type === "element") result.push(...subtree(node).slice(1))
    if (node.type === "processingInstruction") result.push(...node.attributes)
  }
  return result
}

function isUnknown(state: XmlImportAuditState | undefined): boolean {
  return state === "unclaimed" || state === "unknown"
}

function terminalPath(path: readonly string[], terminal: "#attributes" | "#order"): string {
  return path.length === 0 ? terminal : `${formatPath(path)}\\${terminal}`
}

function formatPath(path: readonly string[]): string {
  return path.join("\\")
}

function xmlElementRawValue(element: XmlElementNode): XmlRawValue {
  const attributes: Record<string, XmlRawValue> = {}
  for (const attribute of element.attributes) attributes[`_${attribute.name}`] = attribute.value

  const textNodes = element.content.filter(
    (node): node is XmlTextNode => node.type === "text" && node.value.trim() !== "",
  )
  const structured = element.content.filter(
    (node): node is XmlElementNode | XmlProcessingInstructionNode => node.type !== "text",
  )
  const text = textNodes.map(({ value }) => value).join("")
  if (structured.length === 0 && element.attributes.length === 0) return textNodes.length === 0 ? {} : text
  if (
    structured.length > 0 &&
    textNodes.some((node) => {
      const position = element.content.indexOf(node)
      return position > element.content.findIndex((entry) => entry.type !== "text")
    })
  ) {
    throw new Error(`Смешанный XML-текст ${element.path} не имеет неперекрывающейся raw-границы`)
  }

  const result: Record<string, XmlRawValue> = { ...attributes }
  if (textNodes.length > 0) result["#text"] = text
  const valuesByKey = new Map<string, XmlRawValue[]>()
  const keyOrder: string[] = []
  for (const child of structured) {
    const key = child.type === "element" ? child.name : `?${child.target}`
    const values = valuesByKey.get(key) ?? []
    values.push(
      child.type === "element"
        ? xmlElementRawValue(child)
        : xmlProcessingInstructionRawValue(child),
    )
    valuesByKey.set(key, values)
    keyOrder.push(key)
  }
  for (const [key, values] of valuesByKey) result[key] = values.length === 1 ? values[0]! : values
  const canonicalOrder = [...valuesByKey].flatMap(([key, values]) => values.map(() => key))
  if (canonicalOrder.some((key, index) => key !== keyOrder[index])) result["#order"] = keyOrder
  return result
}

function xmlProcessingInstructionRawValue(node: XmlProcessingInstructionNode): XmlRawValue {
  const result: Record<string, string> = {}
  for (const attribute of node.attributes) result[`_${attribute.name}`] = attribute.value
  const reconstructed = node.attributes.map(({ name, value }) => `${name}="${value}"`).join(" ")
  if (node.body.trim() !== reconstructed) {
    throw new Error(`Processing instruction ${node.path} нельзя представить raw без потери body`)
  }
  return result
}
