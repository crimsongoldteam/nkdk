import type {
  CompiledMetadataPathCursor,
  CompiledMetadataPathIndex,
} from "./types"

interface ActivePathState {
  readonly node: CompiledPathNode
  readonly values: Readonly<Record<string, string>>
}

interface CompiledPathNode {
  readonly exactChildren: ReadonlyMap<string, CompiledPathNode>
  readonly parameterChildren: readonly CompiledParameterTransition[]
  readonly compoundChildren: readonly CompiledCompoundTransition[]
  readonly restChildren: readonly CompiledRestTransition[]
  readonly restParameter?: string
  readonly nodeIds: readonly string[]
}

interface CompiledParameterTransition {
  readonly name: string
  readonly node: CompiledPathNode
}

interface CompiledCompoundTransition {
  readonly node: CompiledPathNode
  readonly extract: (segment: string) => readonly (readonly [string, string])[] | undefined
}

interface CompiledRestTransition {
  readonly name: string
  readonly node: CompiledPathNode
}

interface MutablePathNode {
  readonly exactChildren: Map<string, MutablePathNode>
  readonly parameterChildren: MutableParameterTransition[]
  readonly compoundChildren: MutableCompoundTransition[]
  readonly restChildren: MutableRestTransition[]
  restParameter?: string
  readonly nodeIds: string[]
}

interface MutableParameterTransition {
  readonly name: string
  readonly node: MutablePathNode
}

interface MutableCompoundTransition {
  readonly pattern: string
  readonly node: MutablePathNode
}

interface MutableRestTransition {
  readonly name: string
  readonly node: MutablePathNode
}

const EMPTY_VALUES: Readonly<Record<string, string>> = Object.freeze({})

export function compileMetadataPathIndex(
  entries: readonly (readonly [nodeId: string, pattern: string])[],
): CompiledMetadataPathIndex {
  const root = createMutableNode()

  for (const [nodeId, pattern] of entries) addEntry(root, nodeId, pattern)

  const compiledRoot = compileNode(root)
  const createRoot = () => createCursor([{ node: compiledRoot, values: EMPTY_VALUES }])
  return Object.freeze({
    root: createRoot,
    match(path: string) {
      let cursor: CompiledMetadataPathCursor | undefined = createRoot()
      for (const segment of splitPath(path)) cursor = cursor?.advance(segment)
      return cursor?.matches() ?? []
    },
  })
}

function createMutableNode(restParameter?: string): MutablePathNode {
  return {
    exactChildren: new Map(),
    parameterChildren: [],
    compoundChildren: [],
    restChildren: [],
    ...(restParameter === undefined ? {} : { restParameter }),
    nodeIds: [],
  }
}

function addEntry(root: MutablePathNode, nodeId: string, pattern: string): void {
  const segments = splitPath(pattern)
  let node = root

  for (const [index, segment] of segments.entries()) {
    const restName = segment.match(/^\{([^}]+)\.\.\.\}$/)?.[1]
    if (restName !== undefined) {
      if (index !== segments.length - 1) return
      const transition = node.restChildren.find((candidate) => candidate.name === restName)
        ?? { name: restName, node: createMutableNode(restName) }
      if (!node.restChildren.includes(transition)) node.restChildren.push(transition)
      node = transition.node
      continue
    }

    const parameterName = segment.match(/^\{([^}]+)\}$/)?.[1]
    if (parameterName !== undefined) {
      const transition = node.parameterChildren.find((candidate) => candidate.name === parameterName)
        ?? { name: parameterName, node: createMutableNode() }
      if (!node.parameterChildren.includes(transition)) node.parameterChildren.push(transition)
      node = transition.node
      continue
    }

    if (!segment.includes("{")) {
      const child = node.exactChildren.get(segment) ?? createMutableNode()
      node.exactChildren.set(segment, child)
      node = child
      continue
    }

    const transition = node.compoundChildren.find((candidate) => candidate.pattern === segment)
      ?? { pattern: segment, node: createMutableNode() }
    if (!node.compoundChildren.includes(transition)) node.compoundChildren.push(transition)
    node = transition.node
  }

  node.nodeIds.push(nodeId)
}

function compileNode(node: MutablePathNode): CompiledPathNode {
  return Object.freeze({
    exactChildren: new Map([...node.exactChildren].map(([segment, child]) => [segment, compileNode(child)])),
    parameterChildren: Object.freeze(
      node.parameterChildren.map(({ name, node: child }) => Object.freeze({ name, node: compileNode(child) }))
    ),
    compoundChildren: Object.freeze(
      node.compoundChildren.map(({ pattern, node: child }) =>
        Object.freeze({ node: compileNode(child), extract: compileSegmentExtractor(pattern) })
      )
    ),
    restChildren: Object.freeze(
      node.restChildren.map(({ name, node: child }) => Object.freeze({ name, node: compileNode(child) }))
    ),
    ...(node.restParameter === undefined ? {} : { restParameter: node.restParameter }),
    nodeIds: Object.freeze([...node.nodeIds]),
  })
}

function compileSegmentExtractor(
  pattern: string
): (segment: string) => readonly (readonly [string, string])[] | undefined {
  const names = [...pattern.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]!)
  const expression = new RegExp(
    `^${pattern
      .split(/\{[^}]+\}/g)
      .map(escapeRegExp)
      .join("(.+)")}$`
  )
  return (segment) => {
    const match = expression.exec(segment)
    if (match === null) return undefined
    return names.map((name, index) => [name, match[index + 1]!] as const)
  }
}

function createCursor(states: readonly ActivePathState[]): CompiledMetadataPathCursor {
  const frozenStates = Object.freeze([...states])
  return Object.freeze({
    canDescend: frozenStates.some(canDescend),
    advance(segment: string) {
      const nextStates: ActivePathState[] = []
      for (const state of frozenStates) advanceState(state, segment, nextStates)
      return nextStates.length === 0 ? undefined : createCursor(nextStates)
    },
    matches() {
      return frozenStates.flatMap(({ node, values }) =>
        node.nodeIds.map((nodeId) => Object.freeze({ nodeId, values }))
      )
    },
  })
}

function canDescend({ node }: ActivePathState): boolean {
  return node.restParameter !== undefined
    || node.exactChildren.size > 0
    || node.parameterChildren.length > 0
    || node.compoundChildren.length > 0
    || node.restChildren.length > 0
}

function advanceState(
  { node, values }: ActivePathState,
  segment: string,
  nextStates: ActivePathState[]
): void {
  if (node.restParameter !== undefined) {
    const previous = values[node.restParameter]
    if (previous !== undefined) {
      nextStates.push({
        node,
        values: Object.freeze({ ...values, [node.restParameter]: `${previous}/${segment}` }),
      })
    }
  }

  const exactChild = node.exactChildren.get(segment)
  if (exactChild !== undefined) nextStates.push({ node: exactChild, values })

  for (const { name, node: child } of node.parameterChildren) {
    const nextValues = bind(values, name, segment)
    if (nextValues !== undefined) nextStates.push({ node: child, values: nextValues })
  }

  for (const { extract, node: child } of node.compoundChildren) {
    const extracted = extract(segment)
    const nextValues = extracted === undefined ? undefined : bindAll(values, extracted)
    if (nextValues !== undefined) nextStates.push({ node: child, values: nextValues })
  }

  for (const { name, node: child } of node.restChildren) {
    const nextValues = bind(values, name, segment)
    if (nextValues !== undefined) nextStates.push({ node: child, values: nextValues })
  }
}

function bind(
  values: Readonly<Record<string, string>>,
  name: string,
  value: string
): Readonly<Record<string, string>> | undefined {
  const previous = values[name]
  if (previous !== undefined) return previous === value ? values : undefined
  return Object.freeze({ ...values, [name]: value })
}

function bindAll(
  values: Readonly<Record<string, string>>,
  entries: readonly (readonly [string, string])[]
): Readonly<Record<string, string>> | undefined {
  let nextValues = values
  for (const [name, value] of entries) {
    const bound = bind(nextValues, name, value)
    if (bound === undefined) return undefined
    nextValues = bound
  }
  return nextValues
}

function splitPath(path: string): string[] {
  if (path === "") return []
  return path.replace(/\\/g, "/").split("/")
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
