export interface TopologyMetadataTargetOwnerRule {
  readonly itemType: string
  readonly metadataTargetOwner?:
    | { readonly kind: "inherit" }
    | { readonly kind: "self"; readonly root: string }
    | { readonly kind: "resolver" }
}

export interface TopologyMetadataTargetOwner {
  readonly root: string
  readonly objectName: string
}

export interface TopologyMetadataTargetOwnerFrame {
  readonly itemType: string
  readonly name: string
  readonly owner?: TopologyMetadataTargetOwner
}

export type TopologyMetadataTargetOwnerResolver = (params: {
  readonly itemRule: TopologyMetadataTargetOwnerRule
  readonly name: string | undefined
  readonly frames: readonly TopologyMetadataTargetOwnerFrame[]
  readonly context?: object
}) => TopologyMetadataTargetOwner | undefined

const resolvers = new Map<string, TopologyMetadataTargetOwnerResolver>()

export function registerTopologyMetadataTargetOwnerResolver(
  itemType: string,
  resolver: TopologyMetadataTargetOwnerResolver,
): void {
  resolvers.set(itemType, resolver)
}

export function getTopologyMetadataTargetOwnerResolver(
  itemType: string,
): TopologyMetadataTargetOwnerResolver | undefined {
  return resolvers.get(itemType)
}

export function resolveTopologyMetadataTargetOwner(params: {
  readonly itemRule: TopologyMetadataTargetOwnerRule
  readonly name: string | undefined
  readonly frames: readonly TopologyMetadataTargetOwnerFrame[]
  readonly context?: object
}): TopologyMetadataTargetOwner | undefined {
  const currentFrame = params.frames.at(-1)
  if (currentFrame?.itemType === params.itemRule.itemType && currentFrame.name === params.name) {
    return currentFrame.owner
  }
  const resolver = getTopologyMetadataTargetOwnerResolver(params.itemRule.itemType)
  const resolved = resolver?.(params)
  if (resolved !== undefined) return resolved

  const declaration = params.itemRule.metadataTargetOwner
  if (declaration?.kind === "inherit") return lastResolvedOwner(params.frames)
  if (declaration?.kind === "self") {
    return params.name === undefined ? undefined : { root: declaration.root, objectName: params.name }
  }
  return undefined
}

export function clearTopologyMetadataTargetOwnerResolversForTests(): void {
  resolvers.clear()
}

function lastResolvedOwner(
  frames: readonly TopologyMetadataTargetOwnerFrame[],
): TopologyMetadataTargetOwner | undefined {
  for (let index = frames.length - 1; index >= 0; index -= 1) {
    const owner = frames[index]?.owner
    if (owner !== undefined) return owner
  }
  return undefined
}
