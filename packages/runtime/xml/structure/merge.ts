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

interface UnresolvedRawPath {
  readonly source: string
  readonly segments: readonly string[]
  readonly terminal?: RawPathTerminal
}

interface CanonicalRawPath extends UnresolvedRawPath {
  readonly rootName: string
}

type PlannedBoundary =
  | {
      readonly path: CanonicalRawPath
      readonly kind: "element"
      readonly fragment: XmlRawFragment
    }
  | {
      readonly path: CanonicalRawPath
      readonly kind: "attributes"
      readonly attributes: XmlRawAttributes
    }
  | {
      readonly path: CanonicalRawPath
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
  readonly origin: "ordinary" | "planned"
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
  const roots = ordinaryRoots.map((node) => toMutableElement(node, "ordinary"))
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
    const elementName = path.segments.at(-1) ?? path.rootName
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

function parseRawPath(source: string): UnresolvedRawPath {
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
  path: UnresolvedRawPath,
  ordinaryRoots: readonly XmlElementNode[]
): CanonicalRawPath {
  const soleRoot = ordinaryRoots.length === 1 ? ordinaryRoots[0] : undefined
  if (soleRoot !== undefined) {
    const startsWithRoot = path.segments[0] === soleRoot.name
    // Пользовательский путь всегда относителен к корню. Поэтому один Root
    // означает одноимённый wrapper, а root-inclusive Root\Root канонизируется
    // в ту же цель снятием ровно первого сегмента.
    const rootIsIncluded = startsWithRoot && path.segments[1] === soleRoot.name
    return {
      ...path,
      rootName: soleRoot.name,
      segments: rootIsIncluded ? path.segments.slice(1) : path.segments,
    }
  }

  const rootMatches = ordinaryRoots.filter(({ name }) => name === path.segments[0])
  if (rootMatches.length !== 1) {
    throw new Error(`XML-путь не имеет однозначного корня: ${path.source}`)
  }
  return {
    ...path,
    rootName: rootMatches[0]!.name,
    segments: path.segments.slice(1),
  }
}

function canonicalRawPathKey(path: CanonicalRawPath): string {
  const terminal =
    path.terminal === "attributes"
      ? "#attributes"
      : path.terminal === "order"
        ? "#order"
        : undefined
  return [path.rootName, ...path.segments, ...(terminal === undefined ? [] : [terminal])].join(
    "\\"
  )
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
        left.path.rootName === right.path.rootName &&
        ((left.kind === "element" && isPathPrefix(left.path.segments, right.path.segments)) ||
          (right.kind === "element" && isPathPrefix(right.path.segments, left.path.segments)))
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
    boundary.path,
    boundary.fragment.nodes.length > 0
  )
  if (location === undefined) return
  const inserted = boundary.fragment.nodes.map((node) => toMutableElement(node, "planned"))
  const canonicalName = boundary.path.segments.at(-1) ?? boundary.path.rootName
  const existingCanonical = location.elements.filter((node) => node.name === canonicalName)
  if (existingCanonical.length > 0 && !boundary.fragment.suppressOrdinaryOutput) {
    throw new Error(`Raw-вставка ${boundary.path.source} пересекается с обычным выводом`)
  }
  if (
    boundary.fragment.suppressOrdinaryOutput &&
    existingCanonical.some((node) => node.origin === "planned")
  ) {
    throw new Error(`Raw-вставка ${boundary.path.source} пересекается с обычным выводом`)
  }

  const suppressibleElements = new Set(
    boundary.fragment.suppressOrdinaryOutput
      ? existingCanonical.filter((node) => node.origin === "ordinary")
      : []
  )
  const retained = location.elements.filter((node) => !suppressibleElements.has(node))
  const insertedNames = new Set(inserted.map(({ name }) => name))
  const collisionCandidates = location.siblings.filter(
    (node) => !suppressibleElements.has(node)
  )
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
  path: CanonicalRawPath,
  createParents: boolean
): ElementLocation | undefined {
  const rootMatches = roots.filter(({ name }) => name === path.rootName)
  if (rootMatches.length !== 1) {
    throw new Error(`XML-путь не имеет однозначного корня: ${path.source}`)
  }
  if (path.segments.length > 0) {
    return childLocation(rootMatches[0]!, path.segments, createParents)
  }
  return {
    elements: rootMatches,
    siblings: roots,
    replace: (elements) => replaceNamedElements(roots, path.rootName, elements),
  }
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
      : [{ boundary, parent: resolveExistingElement(roots, boundary.path) }]
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
      orderableTerminalContent(parent.content),
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
    parent.content = reorder(
      orderableTerminalContent(parent.content),
      boundary.order,
      orderedContentName,
    )
  }
}

function resolveExistingElement(
  roots: readonly MutableXmlElementNode[],
  path: CanonicalRawPath
): MutableXmlElementNode {
  const rootMatches = roots.filter(({ name }) => name === path.rootName)
  if (rootMatches.length !== 1) {
    throw new Error(`XML-путь не имеет однозначного корня: ${path.source}`)
  }
  let current = rootMatches[0]!
  for (const segment of path.segments) {
    const matches = childElements(current, segment)
    if (matches.length !== 1) {
      throw new Error(`Не найден однозначный XML-путь: ${path.source}`)
    }
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

function orderedContentName(node: MutableXmlContentNode): string {
  if (node.type === "text") return "#text"
  return node.type === "element" ? node.name : `?${node.target}`
}

function orderableTerminalContent(
  content: readonly MutableXmlContentNode[],
): MutableXmlContentNode[] {
  if (!content.some((node) => node.type !== "text")) return [...content]
  return content.filter((node) => node.type !== "text" || node.value.trim() !== "")
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
  return toMutableElement(
    decodeXmlRawValue({}, { elementName: name }).nodes[0]!,
    "planned"
  )
}

function toMutableElement(
  node: XmlElementNode,
  origin: MutableXmlElementNode["origin"]
): MutableXmlElementNode {
  return {
    ...node,
    origin,
    attributes: node.attributes.map((attribute) => ({ ...attribute })),
    content: node.content.map((child) =>
      child.type === "element" ? toMutableElement(child, origin) : { ...child }
    ),
  }
}
