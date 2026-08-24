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
  readonly fragment?: XmlRawFragment
  /** Номера вхождений (с единицы) для сегментов `path`; `null` означает обычный однозначный сегмент. */
  readonly occurrencePath?: readonly (number | null)[]
  /** Зарегистрированная транспортная замена уже существующего XML-атрибута. */
  readonly attributeOverride?: { readonly name: string; readonly value: string }
  /** Порядок XML-sibling для вставки поднятой raw-границы. */
  readonly siblingOrder?: readonly string[]
}

type RawPathTerminal = "attributes" | "order"

interface UnresolvedRawPath {
  readonly source: string
  readonly segments: readonly string[]
  readonly occurrences: readonly (number | null)[]
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
      readonly siblingOrder?: readonly string[]
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
  | {
      readonly path: CanonicalRawPath
      readonly kind: "attributeOverride"
      readonly attribute: { readonly name: string; readonly value: string }
    }

type PlannedTerminalBoundary = Exclude<PlannedBoundary, { readonly kind: "element" }>

interface ResolvedTerminalBoundary {
  readonly boundary: PlannedTerminalBoundary
  readonly parent: MutableXmlElementNode
}

interface ResolvedElementBoundary {
  readonly boundary: Extract<PlannedBoundary, { readonly kind: "element" }>
  readonly location?: ElementLocation
}

interface MutableMergePlan {
  readonly roots: MutableXmlElementNode[]
  readonly elements: readonly ResolvedElementBoundary[]
  readonly terminals: readonly ResolvedTerminalBoundary[]
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
  const validationPlan = resolveMutableMergePlan(ordinaryRoots, planned)
  applyElementBoundaries(validationPlan.elements)
  validateTerminalBoundaries(validationPlan.terminals)

  const resultPlan = resolveMutableMergePlan(ordinaryRoots, planned)
  applyElementBoundaries(resultPlan.elements)
  applyTerminalBoundaries(resultPlan.terminals)

  return readdressXmlElementNodes(resultPlan.roots)
}

function resolveMutableMergePlan(
  ordinaryRoots: readonly XmlElementNode[],
  boundaries: readonly PlannedBoundary[]
): MutableMergePlan {
  const roots = ordinaryRoots.map((node) => toMutableElement(node, "ordinary"))
  // Все физические цели фиксируются до первой структурной мутации. Ссылки на
  // узлы остаются устойчивыми, даже когда более раннее вхождение удаляется.
  const terminals = resolveTerminalBoundaries(roots, boundaries)
  const elements = boundaries.flatMap((boundary): ResolvedElementBoundary[] =>
    boundary.kind === "element"
      ? [{
          boundary,
          location: resolveElementLocation(
            roots,
            boundary.path,
            boundary.fragment.nodes.length > 0,
          ),
        }]
      : [],
  )
  return { roots, elements, terminals }
}

function applyElementBoundaries(
  boundaries: readonly ResolvedElementBoundary[],
): void {
  for (const boundary of boundaries) applyElementBoundary(boundary)
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
    const path = canonicalizeRawPath(parseRawPath(boundary), ordinaryRoots)
    const pathKey = canonicalRawPathKey(path)
    if (occupiedPaths.has(pathKey)) {
      throw new Error(`Обнаружена повторная запись XML-пути: ${path.source}`)
    }
    occupiedPaths.add(pathKey)

    if (boundary.attributeOverride !== undefined) {
      if (path.terminal !== undefined || boundary.fragment !== undefined || boundary.suppressOrdinaryOutput) {
        throw new Error(`Транспортная замена XML-атрибута недопустима для границы: ${path.source}`)
      }
      return { path, kind: "attributeOverride", attribute: boundary.attributeOverride }
    }
    if (boundary.fragment !== undefined) {
      if (path.terminal !== undefined) {
        throw new Error(`Структурный raw-фрагмент недопустим для терминала: ${path.source}`)
      }
      return {
        path,
        kind: "element",
        fragment: {
          nodes: readdressXmlElementNodes(boundary.fragment.nodes),
          suppressOrdinaryOutput: boundary.suppressOrdinaryOutput,
        },
        ...(boundary.siblingOrder === undefined ? {} : { siblingOrder: boundary.siblingOrder }),
      }
    }
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
      ...(boundary.siblingOrder === undefined ? {} : { siblingOrder: boundary.siblingOrder }),
    }
  })
}

function parseRawPath(boundary: XmlRawMergeBoundary): UnresolvedRawPath {
  const source = boundary.path
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
  const declaredOccurrences = boundary.occurrencePath ?? parts.map(() => null)
  if (
    declaredOccurrences.length !== parts.length ||
    declaredOccurrences.some((occurrence) =>
      occurrence !== null && (!Number.isInteger(occurrence) || occurrence < 1)
    )
  ) {
    throw new Error(`Недопустимый путь вхождений XML: ${source}`)
  }
  const occurrences = terminal === undefined
    ? declaredOccurrences
    : declaredOccurrences.slice(0, -1)
  return { source, segments, occurrences, ...(terminal === undefined ? {} : { terminal }) }
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
      occurrences: rootIsIncluded ? path.occurrences.slice(1) : path.occurrences,
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
    occurrences: path.occurrences.slice(1),
  }
}

function canonicalRawPathKey(path: CanonicalRawPath): string {
  const terminal =
    path.terminal === "attributes"
      ? "#attributes"
      : path.terminal === "order"
        ? "#order"
        : undefined
  const segments = path.segments.map((segment, index) =>
    `${segment}[${path.occurrences[index] ?? "*"}]`
  )
  return [path.rootName, ...segments, ...(terminal === undefined ? [] : [terminal])].join("\\")
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
        ((left.kind === "element" && isPathPrefix(left.path, right.path)) ||
          (right.kind === "element" && isPathPrefix(right.path, left.path)))
      ) {
        throw new Error(`Найдены перекрывающиеся raw-границы: ${left.path.source} и ${right.path.source}`)
      }
    }
  }
}

function isPathPrefix(prefix: CanonicalRawPath, value: CanonicalRawPath): boolean {
  return prefix.segments.length <= value.segments.length && prefix.segments.every((segment, index) =>
    segment === value.segments[index] && occurrencesOverlap(
      prefix.occurrences[index] ?? null,
      value.occurrences[index] ?? null,
    )
  )
}

function occurrencesOverlap(left: number | null, right: number | null): boolean {
  return left === null || right === null || left === right
}

function applyElementBoundary(
  resolved: ResolvedElementBoundary,
): void {
  const { boundary, location } = resolved
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
  const selectedOccurrence = boundary.path.occurrences.at(-1) ?? null
  const collisionCandidates = location.siblings().filter(
    (node) =>
      !suppressibleElements.has(node) &&
      !(
        selectedOccurrence !== null &&
        (node.name === canonicalName || insertedNames.has(node.name))
      )
  )
  if (collisionCandidates.some(({ name }) => insertedNames.has(name))) {
    throw new Error(`Raw-вставка ${boundary.path.source} пересекается с обычным выводом`)
  }
  location.replace([...retained, ...inserted])
  if (boundary.siblingOrder !== undefined) location.reorder(boundary.siblingOrder)
}

interface ElementLocation {
  readonly elements: readonly MutableXmlElementNode[]
  readonly siblings: () => readonly MutableXmlElementNode[]
  readonly replace: (elements: readonly MutableXmlElementNode[]) => void
  readonly reorder: (order: readonly string[]) => void
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
    return childLocation(rootMatches[0]!, path.segments, path.occurrences, createParents)
  }
  return {
    elements: rootMatches,
    siblings: () => roots,
    replace: (elements) => replaceNamedElements(roots, path.rootName, elements),
    reorder: () => {},
  }
}

function childLocation(
  root: MutableXmlElementNode,
  segments: readonly string[],
  occurrences: readonly (number | null)[],
  createParents: boolean
): ElementLocation | undefined {
  let parent = root
  for (const [index, segment] of segments.slice(0, -1).entries()) {
    const matches = childElements(parent, segment)
    const selected = selectOccurrence(matches, occurrences[index] ?? null, segment)
    if (selected === undefined) {
      if (!createParents) return undefined
      if (occurrences[index] !== null && occurrences[index] !== undefined) {
        throw new Error(`Не найдено вхождение ${occurrences[index]} XML-сегмента ${segment}`)
      }
      const wrapper = emptyMutableElement(segment)
      parent.content.push(wrapper)
      parent = wrapper
    } else {
      parent = selected
    }
  }
  const name = segments.at(-1)!
  const occurrence = occurrences.at(-1) ?? null
  const allElements = childElements(parent, name)
  const selected = occurrence === null
    ? allElements
    : [selectOccurrence(allElements, occurrence, name)].filter(
        (value): value is MutableXmlElementNode => value !== undefined,
      )
  return {
    elements: selected,
    siblings: () => parent.content.filter(
      (node): node is MutableXmlElementNode => node.type === "element"
    ),
    reorder: (order) => {
      parent.content = reorderStructuralContentPreservingText(parent.content, order)
    },
    replace: (elements) => {
      if (occurrence === null) {
        const firstIndex = parent.content.findIndex(
          (node) => node.type === "element" && node.name === name
        )
        parent.content = parent.content.filter(
          (node) => node.type !== "element" || node.name !== name
        )
        const index = firstIndex < 0 ? parent.content.length : firstIndex
        parent.content.splice(index, 0, ...elements)
        return
      }
      const selectedElement = selected[0]
      if (selectedElement === undefined) {
        if (occurrence !== allElements.length + 1) {
          throw new Error(`Не найдено вхождение ${occurrence} XML-сегмента ${name}`)
        }
        parent.content.push(...elements)
        return
      }
      const index = parent.content.indexOf(selectedElement)
      parent.content.splice(index, 1, ...elements)
    },
  }
}

function selectOccurrence(
  matches: readonly MutableXmlElementNode[],
  occurrence: number | null,
  segment: string,
): MutableXmlElementNode | undefined {
  if (occurrence === null) {
    if (matches.length > 1) throw new Error(`XML-путь неоднозначен на сегменте ${segment}`)
    return matches[0]
  }
  return matches[occurrence - 1]
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
    if (boundary.kind === "attributeOverride") {
      const matches = parent.attributes.filter(({ name }) => name === boundary.attribute.name)
      if (matches.length !== 1) {
        throw new Error(`Не найден однозначный XML-атрибут ${boundary.attribute.name} в ${boundary.path.source}`)
      }
      continue
    }
    const content = boundary.order.includes("#text")
      ? parent.content
      : structuralTerminalContent(parent.content)
    assertExactOrder(content, boundary.order, orderedContentName, boundary.path.source)
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
    if (boundary.kind === "attributeOverride") {
      const index = parent.attributes.findIndex(({ name }) => name === boundary.attribute.name)
      const attribute = parent.attributes[index]!
      parent.attributes[index] = { ...attribute, value: boundary.attribute.value }
      continue
    }
    parent.content = boundary.order.includes("#text")
      ? reorder(parent.content, boundary.order, orderedContentName)
      : reorderStructuralContentPreservingText(parent.content, boundary.order)
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
  for (const [index, segment] of path.segments.entries()) {
    const matches = childElements(current, segment)
    const occurrence = path.occurrences[index] ?? null
    const selected = selectOccurrence(matches, occurrence, segment)
    if (selected === undefined) {
      throw new Error(`Не найден однозначный XML-путь: ${path.source}`)
    }
    current = selected
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

function structuralTerminalContent(
  content: readonly MutableXmlContentNode[],
): MutableXmlContentNode[] {
  return content.filter((node) => node.type !== "text")
}

function reorderStructuralContentPreservingText(
  content: readonly MutableXmlContentNode[],
  order: readonly string[],
): MutableXmlContentNode[] {
  const reordered = reorder(structuralTerminalContent(content), order, orderedContentName)
  let structuralIndex = 0
  return content.map((node) =>
    node.type === "text" ? node : reordered[structuralIndex++]!,
  )
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
