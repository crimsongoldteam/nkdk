import type {
  ConfigurationIdentity,
  ConfigurationXmlNode,
} from "../../configurationIndex/types"
import { childUid } from "../../configurationIndex/logicalAddress"
import type {
  ConfigurationIndexReader,
} from "../../configurationIndex/sharedSnapshot"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { getTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { getCompiledXMLPropertyOrder } from "../../orchestration/property/xmlPropertyOrder"

export interface BaseFormNodeProjection {
  readonly logicalAddress: string
  readonly xmlNodeLogicalAddress: string
  readonly rule: MetadataItemRule
  readonly selectedPropertyKeys: ReadonlySet<string>
}

export function createBaseFormConfigurationIndexReader(params: {
  readonly base: ConfigurationIndexReader
  readonly extension: ConfigurationIndexReader
  readonly extensionIdentityAddresses: ReadonlySet<string>
  readonly nodeProjections?: readonly BaseFormNodeProjection[]
}): ConfigurationIndexReader {
  const identitySource = (logicalAddress: string): ConfigurationIndexReader =>
    params.extensionIdentityAddresses.has(logicalAddress)
      ? params.extension
      : params.base
  const projectedNodes = createProjectedNodes(params)

  return {
    snapshot: params.base.snapshot,
    binding: () => params.base.binding(),
    projectFile: (projectPath) => params.base.projectFile(projectPath),
    projectFiles: () => params.base.projectFiles(),
    identity(logicalAddress, kind) {
      const value = identitySource(logicalAddress).identity(
        logicalAddress,
        kind
      )
      return value
    },
    identities: () => projectedIdentities(params),
    xmlNodes: () => projectedXmlNodes(params, projectedNodes),
    xmlNode: (logicalAddress) =>
      projectedNodes.has(logicalAddress)
        ? projectedNodes.get(logicalAddress)
        : projectSharedXmlNode(
            params.base.xmlNode(logicalAddress),
            params.extension.xmlNode(logicalAddress)
          ),
    xmlValue: (logicalAddress) => params.base.xmlValue(logicalAddress),
  }
}

function createProjectedNodes(params: {
  readonly base: ConfigurationIndexReader
  readonly extension: ConfigurationIndexReader
  readonly nodeProjections?: readonly BaseFormNodeProjection[]
}): ReadonlyMap<string, ConfigurationXmlNode> {
  const result = new Map<string, ConfigurationXmlNode>()
  for (const projection of params.nodeProjections ?? []) {
    result.set(
      projection.xmlNodeLogicalAddress,
      projectXmlNode(params, projection)
    )
    for (const node of projectedNestedPresenceNodes(params, projection)) {
      if (!result.has(node.logicalAddress)) {
        result.set(node.logicalAddress, node)
      }
    }
  }
  return result
}

function projectedNestedPresenceNodes(
  params: {
    readonly base: ConfigurationIndexReader
    readonly extension: ConfigurationIndexReader
  },
  projection: BaseFormNodeProjection
): readonly ConfigurationXmlNode[] {
  const baseNode = params.base.xmlNode(projection.xmlNodeLogicalAddress)
  const extensionNode = params.extension.xmlNode(
    projection.xmlNodeLogicalAddress
  )
  const result: ConfigurationXmlNode[] = []

  for (const [propertyKey, propertyRule] of Object.entries(
    projection.rule.properties
  )) {
    const nestedRule = getTypeRule(
      propertyRule.type,
      "yamlToXMLNestedRule"
    )
    if (
      nestedRule === undefined ||
      nestedRule.kind === "externalFile" ||
      !xmlNodePropertyKeys(baseNode).has(propertyKey) ||
      !xmlNodePropertyKeys(extensionNode).has(propertyKey)
    ) {
      continue
    }

    const logicalAddress = childUid(
      projection.logicalAddress,
      "Свойство",
      propertyRule.yaml ?? propertyKey
    )
    const existing = projectSharedAliases(
      params.base.xmlNode(logicalAddress),
      params.extension.xmlNode(logicalAddress)
    )
    result.push({
      ...existing,
      logicalAddress,
      present: [
        ...(existing?.present ?? []),
        ...(
          existing?.present?.includes(propertyKey) === true
            ? []
            : [propertyKey]
        ),
      ],
    })
  }
  return result
}

function projectXmlNode(
  params: {
    readonly base: ConfigurationIndexReader
    readonly extension: ConfigurationIndexReader
  },
  projection: BaseFormNodeProjection
): ConfigurationXmlNode {
  const baseNode = params.base.xmlNode(projection.xmlNodeLogicalAddress)
  const extensionNode = params.extension.xmlNode(
    projection.xmlNodeLogicalAddress
  )
  const available = new Set(projection.selectedPropertyKeys)
  const present = new Set<string>()

  for (const [propertyKey, rule] of Object.entries(
    projection.rule.properties
  )) {
    if (
      isXmlNodePropertyAvailable(baseNode, propertyKey, rule) &&
      isXmlNodePropertyAvailable(extensionNode, propertyKey, rule)
    ) {
      available.add(propertyKey)
      present.add(propertyKey)
    }
  }

  for (const [propertyKey, rule] of Object.entries(
    projection.rule.properties
  )) {
    const yamlKey = rule.yaml ?? propertyKey
    const propertyStateAddress = childUid(
      projection.logicalAddress,
      "Свойство",
      yamlKey
    )
    const baseHasPropertyState = xmlNodePropertyKeys(
      params.base.xmlNode(propertyStateAddress)
    ).has(propertyKey)
    const extensionHasPropertyState = xmlNodePropertyKeys(
      params.extension.xmlNode(propertyStateAddress)
    ).has(propertyKey)
    if (
      baseHasPropertyState &&
      (
        extensionHasPropertyState ||
        Object.hasOwn(rule, "implicitValueYAML")
      )
    ) {
      available.add(propertyKey)
      present.add(propertyKey)
    }
  }

  const order = getCompiledXMLPropertyOrder(projection.rule).filter(
    (propertyKey) => available.has(propertyKey)
  )
  const orderedPresent = [
    ...order.filter((propertyKey) => present.has(propertyKey)),
    ...[...present].filter((propertyKey) => !order.includes(propertyKey)),
  ]
  const aliases = filterAvailableAliases(
    projectSharedAliases(baseNode, extensionNode)?.aliases,
    available
  )

  return {
    logicalAddress: projection.xmlNodeLogicalAddress,
    ...(orderedPresent.length === 0 ? {} : { present: orderedPresent }),
    ...(Object.keys(aliases).length === 0 ? {} : { aliases }),
  }
}

function isXmlNodePropertyAvailable(
  node: ConfigurationXmlNode | undefined,
  propertyKey: string,
  _rule: MetadataItemRule["properties"][string]
): boolean {
  return node?.present?.includes(propertyKey) === true
}

function xmlNodePropertyKeys(
  node: ConfigurationXmlNode | undefined
): ReadonlySet<string> {
  return new Set(node?.present ?? [])
}

function projectedPropertyOrder(params: {
  readonly effectivePropertyOrder: readonly string[]
  readonly basePropertyOrder: readonly string[]
  readonly extensionPropertyOrder: readonly string[]
  readonly available: ReadonlySet<string>
}): readonly string[] {
  const candidates = uniqueAvailable(
    [
      ...params.effectivePropertyOrder,
      ...params.basePropertyOrder,
      ...params.extensionPropertyOrder,
    ],
    params.available
  )
  const compare = propertyOrderComparator(params)
  const edges = new Map(
    candidates.map((propertyKey) => [
      propertyKey,
      new Set<string>(),
    ])
  )
  for (const order of [
    params.basePropertyOrder,
    params.extensionPropertyOrder,
  ]) {
    const projected = uniqueAvailable(order, params.available)
    for (let index = 1; index < projected.length; index++) {
      edges.get(projected[index - 1]!)?.add(projected[index]!)
    }
  }

  const components = stronglyConnectedPropertyComponents(
    candidates,
    edges,
    compare
  )
  const componentByProperty = new Map<string, number>()
  components.forEach((component, componentIndex) =>
    component.forEach((propertyKey) =>
      componentByProperty.set(propertyKey, componentIndex)
    )
  )
  const componentEdges = new Map(
    components.map((_, componentIndex) => [
      componentIndex,
      new Set<number>(),
    ])
  )
  const indegree = components.map(() => 0)
  for (const [from, targets] of edges) {
    const fromComponent = componentByProperty.get(from)!
    for (const target of targets) {
      const targetComponent = componentByProperty.get(target)!
      if (
        fromComponent === targetComponent ||
        componentEdges.get(fromComponent)?.has(targetComponent) === true
      ) {
        continue
      }
      componentEdges.get(fromComponent)?.add(targetComponent)
      indegree[targetComponent]++
    }
  }

  const compareComponents = (left: number, right: number): number =>
    compare(components[left]![0]!, components[right]![0]!)
  const ready = components
    .map((_, componentIndex) => componentIndex)
    .filter((componentIndex) => indegree[componentIndex] === 0)
    .sort(compareComponents)
  const result: string[] = []
  while (ready.length > 0) {
    const componentIndex = ready.shift()!
    result.push(...components[componentIndex]!)
    for (const target of componentEdges.get(componentIndex) ?? []) {
      indegree[target]--
      if (indegree[target] === 0) {
        ready.push(target)
        ready.sort(compareComponents)
      }
    }
  }
  return result
}

function uniqueAvailable(
  order: readonly string[],
  available: ReadonlySet<string>
): readonly string[] {
  return [...new Set(order.filter((propertyKey) =>
    available.has(propertyKey)
  ))]
}

function propertyOrderComparator(params: {
  readonly effectivePropertyOrder: readonly string[]
  readonly basePropertyOrder: readonly string[]
  readonly extensionPropertyOrder: readonly string[]
}): (left: string, right: string) => number {
  const ranks = [
    new Map(params.effectivePropertyOrder.map((key, index) => [key, index])),
    new Map(params.basePropertyOrder.map((key, index) => [key, index])),
    new Map(params.extensionPropertyOrder.map((key, index) => [key, index])),
  ]
  return (left, right) => {
    for (const rank of ranks) {
      const difference =
        (rank.get(left) ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(right) ?? Number.MAX_SAFE_INTEGER)
      if (difference !== 0) return difference
    }
    return left.localeCompare(right)
  }
}

function stronglyConnectedPropertyComponents(
  properties: readonly string[],
  edges: ReadonlyMap<string, ReadonlySet<string>>,
  compare: (left: string, right: string) => number
): readonly (readonly string[])[] {
  const reverseEdges = new Map(
    properties.map((propertyKey) => [propertyKey, new Set<string>()])
  )
  for (const [from, targets] of edges) {
    for (const target of targets) reverseEdges.get(target)?.add(from)
  }
  const visited = new Set<string>()
  const finished: string[] = []
  const visit = (
    propertyKey: string,
    graph: ReadonlyMap<string, ReadonlySet<string>>,
    output: string[]
  ): void => {
    if (visited.has(propertyKey)) return
    visited.add(propertyKey)
    for (const target of [...(graph.get(propertyKey) ?? [])].sort(compare)) {
      visit(target, graph, output)
    }
    output.push(propertyKey)
  }
  for (const propertyKey of [...properties].sort(compare)) {
    visit(propertyKey, edges, finished)
  }

  visited.clear()
  const components: string[][] = []
  for (const propertyKey of finished.reverse()) {
    if (visited.has(propertyKey)) continue
    const component: string[] = []
    visit(propertyKey, reverseEdges, component)
    component.sort(compare)
    components.push(component)
  }
  return components
}

function projectedXmlNodes(
  params: {
    readonly base: ConfigurationIndexReader
    readonly extension: ConfigurationIndexReader
  },
  projectedNodes: ReadonlyMap<string, ConfigurationXmlNode>
): readonly ConfigurationXmlNode[] {
  const result = params.base
    .xmlNodes()
    .filter(({ logicalAddress }) =>
      !projectedNodes.has(logicalAddress)
    )
    .map((baseNode) =>
      projectSharedXmlNode(
        baseNode,
        params.extension.xmlNode(baseNode.logicalAddress)
      ) ?? baseNode
    )
  return [...result, ...projectedNodes.values()]
}

function projectSharedXmlNode(
  baseNode: ConfigurationXmlNode | undefined,
  extensionNode: ConfigurationXmlNode | undefined
): ConfigurationXmlNode | undefined {
  if (baseNode === undefined || extensionNode === undefined) return baseNode
  const extensionPropertyKeys = xmlNodePropertyKeys(extensionNode)
  const available = new Set(
    [...xmlNodePropertyKeys(baseNode)].filter((propertyKey) =>
      extensionPropertyKeys.has(propertyKey)
    )
  )
  const order = projectedPropertyOrder({
    effectivePropertyOrder: [],
    basePropertyOrder: baseNode.order ?? [],
    extensionPropertyOrder: extensionNode.order ?? [],
    available,
  })
  const aliases = filterAvailableAliases(
    projectSharedAliases(baseNode, extensionNode)?.aliases,
    available
  )
  const present = order.filter((propertyKey) =>
    baseNode.present?.includes(propertyKey) === true ||
    extensionNode.present?.includes(propertyKey) === true
  )
  return {
    logicalAddress: baseNode.logicalAddress,
    ...(order.length === 0 ? {} : { order }),
    ...(present.length === 0 ? {} : { present }),
    ...(Object.keys(aliases).length === 0 ? {} : { aliases }),
  }
}

function projectSharedAliases(
  baseNode: ConfigurationXmlNode | undefined,
  extensionNode: ConfigurationXmlNode | undefined
): ConfigurationXmlNode | undefined {
  if (baseNode === undefined || baseNode.aliases === undefined) {
    return baseNode
  }
  const aliases: Record<string, string> = { ...baseNode.aliases }
  const extensionPropertyKeys = xmlNodePropertyKeys(extensionNode)
  const sharedProperties = new Set(
    (baseNode.present ?? []).filter((propertyKey) =>
      extensionPropertyKeys.has(propertyKey)
    )
  )

  for (const propertyKey of sharedProperties) {
    const baseAlias = baseNode.aliases[propertyKey]
    delete aliases[propertyKey]
    if (baseAlias !== undefined) delete aliases[baseAlias]

    const extensionAlias = extensionNode?.aliases?.[propertyKey]
    if (extensionAlias === undefined) continue
    aliases[propertyKey] = extensionAlias
    const extensionAliasValue = extensionNode?.aliases?.[extensionAlias]
    if (extensionAliasValue !== undefined) {
      aliases[extensionAlias] = extensionAliasValue
    }
  }

  if (Object.keys(aliases).length > 0) return { ...baseNode, aliases }
  const { aliases: _aliases, ...withoutAliases } = baseNode
  return withoutAliases
}

function filterAvailableAliases(
  aliases: Readonly<Record<string, string>> | undefined,
  available: ReadonlySet<string>
): Readonly<Record<string, string>> {
  if (aliases === undefined) return {}
  const result: Record<string, string> = {}
  for (const propertyKey of available) {
    const alias = aliases[propertyKey]
    if (alias === undefined) continue
    result[propertyKey] = alias
    const aliasValue = aliases[alias]
    if (aliasValue !== undefined) result[alias] = aliasValue
  }
  return result
}

function projectedIdentities(params: {
  readonly base: ConfigurationIndexReader
  readonly extension: ConfigurationIndexReader
  readonly extensionIdentityAddresses: ReadonlySet<string>
}): readonly ConfigurationIdentity[] {
  return [
    ...params.base
      .identities()
      .filter(
        ({ logicalAddress }) =>
          !params.extensionIdentityAddresses.has(logicalAddress)
      ),
    ...params.extension
      .identities()
      .filter(({ logicalAddress }) =>
        params.extensionIdentityAddresses.has(logicalAddress)
      ),
  ]
}
