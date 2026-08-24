import type {
  XmlElementNode,
  XmlProcessingInstructionNode,
  XmlTextNode,
} from "../../../xml/import/document"
import type { XmlRawValue } from "../../../xml/structure/rawCodec"
import {
  appendXmlAnnotatedMappingEntry,
  createXmlAnomalyAnnotations,
  type XmlAnomalyAnnotationTable,
  xmlAnnotatedMappingEntries,
} from "../../../yaml/xmlAnomalyAnnotations"
import type {
  XmlImportAuditBoundary,
  XmlImportAuditOutcome,
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
  return projectNamedXmlCollectionWithRuntimeKeys(params).yaml
}

function projectNamedXmlCollectionWithRuntimeKeys<T>(params: {
  readonly entries: readonly NamedXmlCollectionEntry<T>[]
  readonly annotations: XmlAnomalyAnnotationTable
}): { readonly yaml: Record<string, T>; readonly runtimeKeys: readonly string[] } {
  const projected: Record<string, T> = {}
  const runtimeKeys: string[] = []
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
    runtimeKeys.push(appendXmlAnnotatedMappingEntry(projected, params.annotations, {
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
    }))
  }
  return { yaml: projected, runtimeKeys }
}

/**
 * Проецирует record-коллекцию без возможности молча потерять повторные ключи.
 * Таблица может отсутствовать только тогда, когда проекция не потребовала ни одной аннотации.
 */
export function projectNamedXmlCollectionForImport<T>(params: {
  readonly entries: readonly NamedXmlCollectionEntry<T>[]
  readonly annotations?: XmlAnomalyAnnotationTable
}): Record<string, T> {
  return projectNamedXmlCollectionForImportWithRuntimeKeys(params).yaml
}

export function projectNamedXmlCollectionForImportWithRuntimeKeys<T>(params: {
  readonly entries: readonly NamedXmlCollectionEntry<T>[]
  readonly annotations?: XmlAnomalyAnnotationTable
}): { readonly yaml: Record<string, T>; readonly runtimeKeys: readonly string[] } {
  const annotations = params.annotations ?? createXmlAnomalyAnnotations()
  const projected = projectNamedXmlCollectionWithRuntimeKeys({ entries: params.entries, annotations })
  if (params.annotations === undefined && Array.from(annotations.entries()).length > 0) {
    throw new Error("Для сохранения XML-аномалий record-коллекции требуется таблица аннотаций")
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
    params.audit.outcomes().map((outcome) => [outcome.node, outcome] as const),
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
    const structuredContent = element.content.filter(
      (node): node is XmlElementNode | XmlProcessingInstructionNode => node.type !== "text",
    )
    const unknownContent = element.content.filter((node) => isUnknown(outcomes.get(node)?.state))
    const hasMixedText = element.content.some(
      (node) => node.type === "text" && node.value.trim().length > 0,
    )
    const meaningfulUnknownText = hasMixedText && unknownContent.some((node) => node.type === "text")
    const unknownProcessingInstruction = unknownContent.some(
      (node) => node.type === "processingInstruction",
    )
    const unknownElementCannotBeProjected = unknownContent.some((node) => {
      if (node.type !== "element") return false
      assertRawSubtreeDoesNotOverlap(node, outcomes)
      try {
        xmlElementRawValue(node)
        return false
      } catch {
        return true
      }
    })
    if (meaningfulUnknownText || unknownProcessingInstruction || unknownElementCannotBeProjected) {
      liftElementToStableOwner(element, outcomes, params)
      return
    }

    const unknownAttributes = element.attributes.filter((attribute) =>
      isUnknown(outcomes.get(attribute)?.state),
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

    const contentChildren = structuredContent
    const knownElementNames = new Set(
      contentChildren.flatMap((child) =>
        child.type === "element" && !isUnknown(outcomes.get(child)?.state) ? [child.name] : [],
      ),
    )
    let hasUnknownChild = false
    let hasKnownChild = false
    for (const child of contentChildren) {
      const state = outcomes.get(child)?.state
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

  if (isUnknown(outcomes.get(params.root)?.state)) {
    throw new Error(`Ближайший YAML-владелец не заявил XML-корень ${params.root.path}`)
  }
  visitKnownElement(params.root, [])
}

function assertRawSubtreeDoesNotOverlap(
  root: XmlElementNode,
  outcomes: ReadonlyMap<XmlImportAuditedNode, XmlImportAuditOutcome>,
): void {
  for (const node of subtree(root)) {
    if (!isUnknown(outcomes.get(node)?.state)) {
      throw new Error(
        `Raw XML-граница ${root.path} пересекается с известной XML-границей ${node.path}`,
      )
    }
  }
}

function claimUnknownSubtree(
  root: XmlElementNode,
  outcomes: ReadonlyMap<XmlImportAuditedNode, XmlImportAuditOutcome>,
  audit: XmlImportAuditSession,
  boundary: XmlImportAuditBoundary,
): void {
  for (const node of subtree(root)) {
    if (isUnknown(outcomes.get(node)?.state)) audit.claim(node, boundary)
  }
}

function liftElementToStableOwner(
  element: XmlElementNode,
  outcomes: ReadonlyMap<XmlImportAuditedNode, XmlImportAuditOutcome>,
  params: {
    readonly yaml: Record<string, unknown>
    readonly annotations: XmlAnomalyAnnotationTable
    readonly audit: XmlImportAuditSession
    readonly boundary: XmlImportAuditBoundary
  },
): void {
  const elementOutcome = outcomes.get(element)
  if (elementOutcome === undefined || isUnknown(elementOutcome.state)) {
    throw new Error(`Для XML-границы ${element.path} не найден stable owner`)
  }
  if (elementOutcome.state === "ambiguous" || elementOutcome.boundaries.length !== 1) {
    throw new Error(`Для XML-границы ${element.path} неоднозначна owner boundary`)
  }
  if (elementOutcome.state === "duplicate") {
    throw new Error(`Raw XML-граница ${element.path} пересекается с duplicate XML-границей`)
  }
  const owner = elementOutcome.boundaries[0]!
  const ownerKey = xmlImportBoundaryKey(owner)
  const elementSubtree = new Set(subtree(element))
  const checkedBoundaries = new Set<string>()
  for (const node of elementSubtree) {
    const outcome = outcomes.get(node)
    if (outcome === undefined || isUnknown(outcome.state)) continue
    if (outcome.state !== "claimed" || outcome.boundaries.length !== 1) {
      throw new Error(
        `Raw XML-граница ${element.path} пересекается с известной XML-границей ${node.path}`,
      )
    }
    const boundary = outcome.boundaries[0]!
    const boundaryKey = xmlImportBoundaryKey(boundary)
    if (checkedBoundaries.has(boundaryKey)) continue
    checkedBoundaries.add(boundaryKey)
    if (boundaryKey !== ownerKey && !isDescendantYamlBoundary(boundary, owner)) {
      throw new Error(
        `Raw XML-граница ${element.path} пересекается с независимой XML-границей ${node.path}`,
      )
    }
    if (!isBoundaryFullyInsideSubtree(boundaryKey, elementSubtree, outcomes)) {
      throw new Error(
        `Raw XML-граница ${element.path} пересекается с выходящей за subtree XML-границей ${node.path}`,
      )
    }
  }

  const basePath = params.boundary.yamlPath ?? []
  if (owner.yamlPath !== undefined && sameYamlPath(owner.yamlPath, basePath)) {
    if (basePath.length === 0) {
      throw new Error(`XML-граница ${element.path} совпадает с корнем stable YAML owner`)
    }
    return
  }
  replaceStableOwnerYamlValue({
    yaml: params.yaml,
    annotations: params.annotations,
    basePath,
    ownerPath: owner.yamlPath,
    value: xmlElementRawValue(element),
    xmlPath: element.path,
  })
  for (const node of subtree(element)) {
    if (isUnknown(outcomes.get(node)?.state)) params.audit.claim(node, owner)
  }
}

function isDescendantYamlBoundary(
  boundary: XmlImportAuditBoundary,
  owner: XmlImportAuditBoundary,
): boolean {
  if (boundary.yamlPath === undefined || owner.yamlPath === undefined) return false
  return boundary.yamlPath.length > owner.yamlPath.length &&
    startsWithYamlPath(boundary.yamlPath, owner.yamlPath)
}

function isBoundaryFullyInsideSubtree(
  boundaryKey: string,
  elementSubtree: ReadonlySet<XmlImportAuditedNode>,
  outcomes: ReadonlyMap<XmlImportAuditedNode, XmlImportAuditOutcome>,
): boolean {
  for (const outcome of outcomes.values()) {
    if (
      outcome.boundaries.some((boundary) => xmlImportBoundaryKey(boundary) === boundaryKey) &&
      !elementSubtree.has(outcome.node)
    ) return false
  }
  return true
}

function replaceStableOwnerYamlValue(params: {
  yaml: Record<string, unknown>
  annotations: XmlAnomalyAnnotationTable
  basePath: readonly (string | number)[]
  ownerPath: readonly (string | number)[] | undefined
  value: XmlRawValue
  xmlPath: string
}): void {
  if (params.ownerPath === undefined || !startsWithYamlPath(params.ownerPath, params.basePath)) {
    throw new Error(`Для XML-границы ${params.xmlPath} не найден stable YAML owner`)
  }
  const relativePath = params.ownerPath.slice(params.basePath.length)
  if (relativePath.length === 0) {
    throw new Error(`XML-граница ${params.xmlPath} совпадает с корнем stable YAML owner`)
  }

  let parent: unknown = params.yaml
  for (const segment of relativePath.slice(0, -1)) {
    parent = yamlChildAt(parent, segment, params.annotations, params.xmlPath)
  }
  const key = relativePath.at(-1)!
  if (typeof key === "number") {
    if (!Array.isArray(parent) || key < 0 || key >= parent.length) {
      throw new Error(`Для XML-границы ${params.xmlPath} не найден stable YAML owner`)
    }
    parent[key] = params.value
    params.annotations.set(parent, key, { kind: "raw", occurrence: 1, target: "value" })
    return
  }
  if (!isRecord(parent)) {
    throw new Error(`Для XML-границы ${params.xmlPath} не найден stable YAML owner`)
  }
  const runtimeKeys = runtimeKeysForPathSegment(parent, key, params.annotations)
  if (runtimeKeys.length > 1) {
    throw new Error(`Для XML-границы ${params.xmlPath} неоднозначен stable YAML owner`)
  }
  if (runtimeKeys.length === 0) {
    appendXmlAnnotatedMappingEntry(parent, params.annotations, {
      logicalKey: key,
      value: params.value,
      valueAnnotation: { kind: "raw", occurrence: 1 },
    })
    return
  }
  const runtimeKey = runtimeKeys[0]!
  parent[runtimeKey] = params.value
  params.annotations.set(parent, runtimeKey, { kind: "raw", occurrence: 1, target: "value" })
}

function yamlChildAt(
  parent: unknown,
  key: string | number,
  annotations: XmlAnomalyAnnotationTable,
  xmlPath: string,
): unknown {
  if (typeof key === "number") {
    if (!Array.isArray(parent) || key < 0 || key >= parent.length) {
      throw new Error(`Для XML-границы ${xmlPath} не найден stable YAML owner`)
    }
    return parent[key]
  }
  if (!isRecord(parent)) throw new Error(`Для XML-границы ${xmlPath} не найден stable YAML owner`)
  const runtimeKeys = runtimeKeysForPathSegment(parent, key, annotations)
  if (runtimeKeys.length !== 1) {
    const reason = runtimeKeys.length === 0 ? "не найден" : "неоднозначен"
    throw new Error(`Для XML-границы ${xmlPath} ${reason} stable YAML owner`)
  }
  return parent[runtimeKeys[0]!]
}

function runtimeKeysForPathSegment(
  mapping: Record<string, unknown>,
  logicalKey: string,
  annotations: XmlAnomalyAnnotationTable,
): string[] {
  if (Object.prototype.hasOwnProperty.call(mapping, logicalKey)) return [logicalKey]
  return Object.keys(mapping).filter((runtimeKey) =>
    (annotations.keyAt(mapping, runtimeKey)?.logicalKey ?? runtimeKey) === logicalKey,
  )
}

function startsWithYamlPath(
  path: readonly (string | number)[],
  prefix: readonly (string | number)[],
): boolean {
  return prefix.length <= path.length && prefix.every((segment, index) => path[index] === segment)
}

function sameYamlPath(
  left: readonly (string | number)[],
  right: readonly (string | number)[],
): boolean {
  return left.length === right.length && startsWithYamlPath(left, right)
}

function xmlImportBoundaryKey(boundary: XmlImportAuditBoundary): string {
  return JSON.stringify([
    boundary.itemType,
    boundary.propertyKey,
    boundary.propertyType,
    boundary.yamlPath,
    boundary.rulePath,
  ])
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
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

export function xmlElementRawValue(element: XmlElementNode): XmlRawValue {
  const attributes: Record<string, XmlRawValue> = {}
  for (const attribute of element.attributes) attributes[`_${attribute.name}`] = attribute.value

  const structured = element.content.filter(
    (node): node is XmlElementNode | XmlProcessingInstructionNode => node.type !== "text",
  )
  const textNodes = element.content.filter(
    (node): node is XmlTextNode => node.type === "text",
  )
  const textValues = textNodes.map(({ value }) => value)
  if (structured.length === 0 && element.attributes.length === 0) {
    return textNodes.length === 0 ? {} : textValues.join("")
  }

  const result: Record<string, XmlRawValue> = { ...attributes }
  if (textNodes.length > 0) {
    result["#text"] = textValues.length === 1 ? textValues[0]! : textValues
  }
  const valuesByKey = new Map<string, XmlRawValue[]>()
  const keyOrder: string[] = []
  const retainedTextNodes = new Set(textNodes)
  for (const child of element.content) {
    if (child.type === "text") {
      if (retainedTextNodes.has(child)) keyOrder.push("#text")
      continue
    }
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
  const canonicalOrder = [
    ...textValues.map(() => "#text"),
    ...[...valuesByKey].flatMap(([key, values]) => values.map(() => key)),
  ]
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
