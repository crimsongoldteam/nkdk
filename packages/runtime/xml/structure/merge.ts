import type {
  XmlAttributeNode,
  XmlContentNode,
  XmlElementNode,
} from "../import/document"
import {
  decodeXmlRawAttributes,
  decodeXmlRawOrder,
  decodeXmlRawValue,
  readdressXmlElementNodes,
  type XmlRawAttributes,
  type XmlRawFragment,
} from "./rawCodec"

export interface XmlRawMergeBoundary {
  readonly path: string
  readonly value: unknown
  readonly suppressOrdinaryOutput: boolean
  readonly placement?: "value" | "key"
}

type RawPathTerminal = "attributes" | "order"

interface ParsedRawPath {
  readonly source: string
  readonly segments: readonly string[]
  readonly terminal?: RawPathTerminal
}

type PlannedBoundary =
  | {
      readonly path: ParsedRawPath
      readonly kind: "element"
      readonly fragment: XmlRawFragment
    }
  | {
      readonly path: ParsedRawPath
      readonly kind: "attributes"
      readonly attributes: XmlRawAttributes
    }
  | {
      readonly path: ParsedRawPath
      readonly kind: "order"
      readonly order: readonly string[]
    }

type PlannedTerminalBoundary = Exclude<PlannedBoundary, { readonly kind: "element" }>

interface ResolvedTerminalBoundary {
  readonly boundary: PlannedTerminalBoundary
  readonly parent: MutableXmlElementNode
}

interface MutableXmlElementNode
  extends Omit<XmlElementNode, "attributes" | "content"> {
  attributes: XmlAttributeNode[]
  content: MutableXmlContentNode[]
}

type MutableXmlContentNode = Exclude<XmlContentNode, XmlElementNode> | MutableXmlElementNode

const XML_PATH_NAME = /^[:_\p{L}][:_\-.0-9\p{L}\p{M}\p{N}\u00B7]*$/u

export function mergeXmlRawFragments(
  ordinaryRoots: readonly XmlElementNode[],
  boundaries: readonly XmlRawMergeBoundary[]
): readonly XmlElementNode[] {
  const planned = planBoundaries(boundaries, ordinaryRoots)
  assertNonOverlappingBoundaries(planned)

  // Первый проход строит и полностью проверяет недоступный вызывающему
  // проверочный снимок. Только после успеха журнал повторяется над итоговой
  // копией, поэтому ни вход, ни частичный результат ошибки наблюдать нельзя.
  const validationRoots = applyElementBoundaries(ordinaryRoots, planned)
  validateTerminalBoundaries(resolveTerminalBoundaries(validationRoots, planned))

  const resultRoots = applyElementBoundaries(ordinaryRoots, planned)
  applyTerminalBoundaries(resolveTerminalBoundaries(resultRoots, planned))

  return readdressXmlElementNodes(resultRoots)
}

function applyElementBoundaries(
  ordinaryRoots: readonly XmlElementNode[],
  boundaries: readonly PlannedBoundary[]
): MutableXmlElementNode[] {
  const roots = ordinaryRoots.map(toMutableElement)
  for (const boundary of boundaries) {
    if (boundary.kind === "element") applyElementBoundary(roots, boundary)
  }
  return roots
}

function planBoundaries(
  boundaries: readonly XmlRawMergeBoundary[],
  ordinaryRoots: readonly XmlElementNode[]
): readonly PlannedBoundary[] {
  const occupiedPaths = new Set<string>()
  return boundaries.map((boundary): PlannedBoundary => {
    if (boundary.placement === "key") {
      throw new Error("!xml/raw разрешён только на YAML-значении, но не на ключе")
    }
    const path = canonicalizeRawPath(parseRawPath(boundary.path), ordinaryRoots)
    const pathKey = canonicalRawPathKey(path)
    if (occupiedPaths.has(pathKey)) {
      throw new Error(`Обнаружена повторная запись XML-пути: ${path.source}`)
    }
    occupiedPaths.add(pathKey)

    if (path.terminal === "attributes") {
      assertTerminalDoesNotSuppress(boundary, "#attributes")
      return { path, kind: "attributes", attributes: decodeXmlRawAttributes(boundary.value) }
    }
    if (path.terminal === "order") {
      assertTerminalDoesNotSuppress(boundary, "#order")
      return { path, kind: "order", order: decodeXmlRawOrder(boundary.value) }
    }
    const elementName = path.segments.at(-1)!
    return {
      path,
      kind: "element",
      fragment: decodeXmlRawValue(boundary.value, {
        elementName,
        suppressOrdinaryOutput: boundary.suppressOrdinaryOutput,
        placement: boundary.placement,
      }),
    }
  })
}

function parseRawPath(source: string): ParsedRawPath {
  const parts = source.split("\\")
  if (source.length === 0 || parts.some((part) => part.length === 0 || part === "." || part === "..")) {
    throw new Error(`Недопустимый XML-путь: ${source}`)
  }
  const last = parts.at(-1)!
  const terminal = last === "#attributes" ? "attributes" : last === "#order" ? "order" : undefined
  const segments = terminal === undefined ? parts : parts.slice(0, -1)
  if (segments.length === 0 || segments.some((segment) => !XML_PATH_NAME.test(segment))) {
    throw new Error(`Недопустимый XML-путь: ${source}`)
  }
  if (terminal === undefined && last.startsWith("#")) {
    throw new Error(`Недопустимый служебный терминал XML-пути: ${last}`)
  }
  return { source, segments, ...(terminal === undefined ? {} : { terminal }) }
}

function canonicalizeRawPath(
  path: ParsedRawPath,
  ordinaryRoots: readonly XmlElementNode[]
): ParsedRawPath {
  const soleRoot = ordinaryRoots.length === 1 ? ordinaryRoots[0] : undefined
  if (
    soleRoot === undefined ||
    path.segments.length === 1 ||
    path.segments[0] !== soleRoot.name
  ) {
    return path
  }
  return { ...path, segments: path.segments.slice(1) }
}

function canonicalRawPathKey(path: ParsedRawPath): string {
  const terminal =
    path.terminal === "attributes"
      ? "#attributes"
      : path.terminal === "order"
        ? "#order"
        : undefined
  return [...path.segments, ...(terminal === undefined ? [] : [terminal])].join("\\")
}

function assertTerminalDoesNotSuppress(
  boundary: XmlRawMergeBoundary,
  terminal: string
): void {
  if (boundary.suppressOrdinaryOutput) {
    throw new Error(`${terminal} объединяется с обычным выводом и не может подавлять его`)
  }
}

function assertNonOverlappingBoundaries(boundaries: readonly PlannedBoundary[]): void {
  for (let leftIndex = 0; leftIndex < boundaries.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < boundaries.length; rightIndex += 1) {
      const left = boundaries[leftIndex]!
      const right = boundaries[rightIndex]!
      if (
        (left.kind === "element" && isPathPrefix(left.path.segments, right.path.segments)) ||
        (right.kind === "element" && isPathPrefix(right.path.segments, left.path.segments))
      ) {
        throw new Error(`Найдены перекрывающиеся raw-границы: ${left.path.source} и ${right.path.source}`)
      }
    }
  }
}

function isPathPrefix(prefix: readonly string[], value: readonly string[]): boolean {
  return prefix.length <= value.length && prefix.every((segment, index) => segment === value[index])
}

function applyElementBoundary(
  roots: MutableXmlElementNode[],
  boundary: Extract<PlannedBoundary, { readonly kind: "element" }>
): void {
  const location = resolveElementLocation(
    roots,
    boundary.path.segments,
    boundary.fragment.nodes.length > 0
  )
  if (location === undefined) return
  const inserted = boundary.fragment.nodes.map(toMutableElement)
  const canonicalName = boundary.path.segments.at(-1)!
  const existingCanonical = location.elements.filter((node) => node.name === canonicalName)
  if (existingCanonical.length > 0 && !boundary.fragment.suppressOrdinaryOutput) {
    throw new Error(`Raw-вставка ${boundary.path.source} пересекается с обычным выводом`)
  }

  const retained = boundary.fragment.suppressOrdinaryOutput
    ? location.elements.filter((node) => node.name !== canonicalName)
    : [...location.elements]
  const insertedNames = new Set(inserted.map(({ name }) => name))
  const replacedElements = new Set(location.elements)
  const collisionCandidates = boundary.fragment.suppressOrdinaryOutput
    ? location.siblings.filter((node) => !replacedElements.has(node))
    : location.siblings
  if (collisionCandidates.some(({ name }) => insertedNames.has(name))) {
    throw new Error(`Raw-вставка ${boundary.path.source} пересекается с обычным выводом`)
  }
  location.replace([...retained, ...inserted])
}

interface ElementLocation {
  readonly elements: readonly MutableXmlElementNode[]
  readonly siblings: readonly MutableXmlElementNode[]
  readonly replace: (elements: readonly MutableXmlElementNode[]) => void
}

function resolveElementLocation(
  roots: MutableXmlElementNode[],
  segments: readonly string[],
  createParents: boolean
): ElementLocation | undefined {
  const rootMatches = roots.filter(({ name }) => name === segments[0])
  if (rootMatches.length > 1) throw new Error(`XML-путь неоднозначен у корня: ${segments.join("\\")}`)
  if (rootMatches.length === 1) {
    if (segments.length === 1) {
      return {
        elements: rootMatches,
        siblings: roots,
        replace: (elements) => replaceNamedElements(roots, segments[0]!, elements),
      }
    }
    return childLocation(rootMatches[0]!, segments.slice(1), createParents)
  }
  if (roots.length !== 1) {
    throw new Error(`XML-путь не имеет однозначного корня: ${segments.join("\\")}`)
  }
  return childLocation(roots[0]!, segments, createParents)
}

function childLocation(
  root: MutableXmlElementNode,
  segments: readonly string[],
  createParents: boolean
): ElementLocation | undefined {
  let parent = root
  for (const segment of segments.slice(0, -1)) {
    const matches = childElements(parent, segment)
    if (matches.length > 1) throw new Error(`XML-путь неоднозначен на сегменте ${segment}`)
    if (matches.length === 0) {
      if (!createParents) return undefined
      const wrapper = emptyMutableElement(segment)
      parent.content.push(wrapper)
      parent = wrapper
    } else {
      parent = matches[0]!
    }
  }
  const name = segments.at(-1)!
  return {
    elements: childElements(parent, name),
    siblings: parent.content.filter(
      (node): node is MutableXmlElementNode => node.type === "element"
    ),
    replace: (elements) => {
      const firstIndex = parent.content.findIndex(
        (node) => node.type === "element" && node.name === name
      )
      parent.content = parent.content.filter(
        (node) => node.type !== "element" || node.name !== name
      )
      const index = firstIndex < 0 ? parent.content.length : firstIndex
      parent.content.splice(index, 0, ...elements)
    },
  }
}

function resolveTerminalBoundaries(
  roots: readonly MutableXmlElementNode[],
  boundaries: readonly PlannedBoundary[]
): readonly ResolvedTerminalBoundary[] {
  return boundaries.flatMap((boundary) =>
    boundary.kind === "element"
      ? []
      : [{ boundary, parent: resolveExistingElement(roots, boundary.path.segments) }]
  )
}

function validateTerminalBoundaries(
  terminals: readonly ResolvedTerminalBoundary[]
): void {
  for (const { boundary, parent } of terminals) {
    if (boundary.kind === "attributes") {
      const occupied = new Set(parent.attributes.map(({ name }) => name))
      const duplicate = boundary.attributes.attributes.find(({ name }) => occupied.has(name))
      if (duplicate !== undefined) {
        throw new Error(
          `Raw-атрибут _${duplicate.name} в ${boundary.path.source} пересекается с обычным выводом`
        )
      }
      if (boundary.attributes.order !== undefined) {
        assertExactOrder(
          [...parent.attributes, ...boundary.attributes.attributes],
          boundary.attributes.order,
          ({ name }) => `_${name}`,
          boundary.path.source
        )
      }
      continue
    }
    assertExactOrder(
      parent.content.filter((node) => node.type !== "text"),
      boundary.order,
      orderedContentName,
      boundary.path.source
    )
  }
}

function applyTerminalBoundaries(
  terminals: readonly ResolvedTerminalBoundary[]
): void {
  for (const { boundary, parent } of terminals) {
    if (boundary.kind === "attributes") {
      const combined = [
        ...parent.attributes,
        ...boundary.attributes.attributes.map(
          ({ name, value }): XmlAttributeNode => ({
            id: 0,
            occurrence: 1,
            path: "",
            span: { start: 0, end: 0 },
            name,
            value,
          })
        ),
      ]
      parent.attributes =
        boundary.attributes.order === undefined
          ? combined
          : reorder(combined, boundary.attributes.order, ({ name }) => `_${name}`)
      continue
    }
    const texts = parent.content.filter((node) => node.type === "text")
    const ordered = parent.content.filter((node) => node.type !== "text")
    parent.content = [...texts, ...reorder(ordered, boundary.order, orderedContentName)]
  }
}

function resolveExistingElement(
  roots: readonly MutableXmlElementNode[],
  segments: readonly string[]
): MutableXmlElementNode {
  const rootMatches = roots.filter(({ name }) => name === segments[0])
  let current: MutableXmlElementNode
  let remaining: readonly string[]
  if (rootMatches.length === 1) {
    current = rootMatches[0]!
    remaining = segments.slice(1)
  } else if (rootMatches.length === 0 && roots.length === 1) {
    current = roots[0]!
    remaining = segments
  } else {
    throw new Error(`XML-путь не имеет однозначного корня: ${segments.join("\\")}`)
  }
  for (const segment of remaining) {
    const matches = childElements(current, segment)
    if (matches.length !== 1) throw new Error(`Не найден однозначный XML-путь: ${segments.join("\\")}`)
    current = matches[0]!
  }
  return current
}

function assertExactOrder<T>(
  values: readonly T[],
  order: readonly string[],
  key: (value: T) => string,
  path: string
): void {
  const actual = values.map(key).toSorted()
  const requested = [...order].toSorted()
  if (
    actual.length !== requested.length ||
    actual.some((value, index) => value !== requested[index])
  ) {
    throw new Error(`${path} должен ровно перечислять объединённый XML-порядок`)
  }
}

function reorder<T>(
  values: readonly T[],
  order: readonly string[],
  key: (value: T) => string
): T[] {
  const queues = Map.groupBy(values, key)
  const offsets = new Map<string, number>()
  return order.map((name) => {
    const offset = offsets.get(name) ?? 0
    const value = queues.get(name)?.[offset]
    if (value === undefined) throw new Error(`Неверный XML-порядок: ${name}`)
    offsets.set(name, offset + 1)
    return value
  })
}

function orderedContentName(node: Exclude<MutableXmlContentNode, { readonly type: "text" }>): string {
  return node.type === "element" ? node.name : `?${node.target}`
}

function childElements(
  parent: MutableXmlElementNode,
  name: string
): MutableXmlElementNode[] {
  return parent.content.filter(
    (node): node is MutableXmlElementNode => node.type === "element" && node.name === name
  )
}

function replaceNamedElements(
  roots: MutableXmlElementNode[],
  name: string,
  replacements: readonly MutableXmlElementNode[]
): void {
  const firstIndex = roots.findIndex((node) => node.name === name)
  const retained = roots.filter((node) => node.name !== name)
  retained.splice(firstIndex < 0 ? retained.length : firstIndex, 0, ...replacements)
  roots.splice(0, roots.length, ...retained)
}

function emptyMutableElement(name: string): MutableXmlElementNode {
  return toMutableElement(decodeXmlRawValue({}, { elementName: name }).nodes[0]!)
}

function toMutableElement(node: XmlElementNode): MutableXmlElementNode {
  return {
    ...node,
    attributes: node.attributes.map((attribute) => ({ ...attribute })),
    content: node.content.map((child) =>
      child.type === "element" ? toMutableElement(child) : { ...child }
    ),
  }
}
