import type { MetadataTargetOwner } from "../../commonObjects/metadataTargets/types"
import type { ConfigurationContext } from "../../context/types"
import type { MetadataItemRule } from "./types"
import {
  clearTopologyMetadataTargetOwnerResolversForTests,
  getTopologyMetadataTargetOwnerResolver,
  registerTopologyMetadataTargetOwnerResolver,
} from "../../resourceTopology/metadataTargetOwner"

export interface MetadataTargetOwnerFrame {
  itemType: string
  name: string
  owner?: MetadataTargetOwner
}

export type MetadataTargetOwnerResolver = (params: {
  itemRule: MetadataItemRule
  name: string | undefined
  frames: readonly MetadataTargetOwnerFrame[]
  context?: ConfigurationContext
}) => MetadataTargetOwner | undefined

export function registerMetadataTargetOwnerResolver(itemType: string, resolver: MetadataTargetOwnerResolver): void {
  registerTopologyMetadataTargetOwnerResolver(itemType, (params) => resolver({
    itemRule: params.itemRule as MetadataItemRule,
    name: params.name,
    frames: params.frames.map((frame) => ({
      itemType: frame.itemType,
      name: frame.name,
      ...(frame.owner === undefined ? {} : { owner: frame.owner as MetadataTargetOwner }),
    })),
    ...(params.context === undefined ? {} : { context: params.context as ConfigurationContext }),
  }))
}

export function getMetadataTargetOwnerResolver(itemType: string): MetadataTargetOwnerResolver | undefined {
  return getTopologyMetadataTargetOwnerResolver(itemType) as MetadataTargetOwnerResolver | undefined
}

export function clearMetadataTargetOwnerResolversForTests(): void {
  clearTopologyMetadataTargetOwnerResolversForTests()
}
