import type { MetadataTargetOwner } from "../../commonObjects/metadataTargets/types"
import type { ConfigurationContext } from "../../context/types"
import type { MetadataItemRule } from "./types"

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

const resolvers = new Map<string, MetadataTargetOwnerResolver>()

export function registerMetadataTargetOwnerResolver(itemType: string, resolver: MetadataTargetOwnerResolver): void {
  resolvers.set(itemType, resolver)
}

export function getMetadataTargetOwnerResolver(itemType: string): MetadataTargetOwnerResolver | undefined {
  return resolvers.get(itemType)
}

export function clearMetadataTargetOwnerResolversForTests(): void {
  resolvers.clear()
}
