import type {
  TopologyMetadataTargetOwner,
  TopologyMetadataTargetOwnerFrame,
  TopologyMetadataTargetOwnerResolver,
  TopologyMetadataTargetOwnerRule,
} from "../core/types"
import { getMetadataTargetOwnerResolver } from "../../ruleRuntime/property/metadataTargetOwnerRegistry"

export type {
  TopologyMetadataTargetOwner,
  TopologyMetadataTargetOwnerFrame,
  TopologyMetadataTargetOwnerResolver,
  TopologyMetadataTargetOwnerRule,
} from "../core/types"

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
  const resolver = getMetadataTargetOwnerResolver(params.itemRule.itemType) as
    | TopologyMetadataTargetOwnerResolver
    | undefined
  const resolved = resolver?.(params)
  if (resolved !== undefined) return resolved

  const declaration = params.itemRule.metadataTargetOwner
  if (declaration?.kind === "inherit") return lastResolvedOwner(params.frames)
  if (declaration?.kind === "self") {
    return params.name === undefined ? undefined : { root: declaration.root, objectName: params.name }
  }
  return undefined
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
