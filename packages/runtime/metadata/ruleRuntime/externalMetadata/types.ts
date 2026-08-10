import type { MetadataItemType } from "../metadataItem/registry"

export type ExternalMetadataItemPlacement = "rootEntry" | "ownerChild" | "ownedEntry"
export type ExternalMetadataPropertyPlacement = "derivedEntry"

export interface ExternalMetadataItemRule {
  segment: string
  placement: ExternalMetadataItemPlacement
}

export interface ExternalMetadataPropertyRule {
  segment: string
  placement: ExternalMetadataPropertyPlacement
}

export interface ExternalMetadataContextItem {
  itemType: MetadataItemType
  name: string
  path: string
  externalMetadata?: ExternalMetadataItemRule
}

export interface ExternalMetadataCollector {
  recordUuid(params: { itemsTree: readonly ExternalMetadataContextItem[]; uuid: string }): void
  recordDerived(params: { itemsTree: readonly ExternalMetadataContextItem[]; segment: string; name?: string }): void
}
