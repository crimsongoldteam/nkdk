import type { MetadataTargetOwner } from "../metadataTarget/types"
import type { ConfigurationContext } from "../../context/types"
import type { MetadataItemRule } from "./types"
import { currentPropertyRuleRegistrySet } from "./propertyRuleExecutionContext"

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

export function getMetadataTargetOwnerResolver(itemType: string): MetadataTargetOwnerResolver | undefined {
  return currentPropertyRuleRegistrySet<{
    getMetadataTargetOwnerResolver(type: string): MetadataTargetOwnerResolver | undefined
  }>()?.getMetadataTargetOwnerResolver(itemType)
}
