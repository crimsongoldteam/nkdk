import type {
  ConfigurationContext,
  ConfigurationContextWithExportToXML,
  ContextElementToXML,
  MetadataTargetOwnerContext,
} from "../../context/types"
import type { MetadataTargetOwner } from "../../commonObjects/metadataTargets/types"
import type { MetadataItemType } from "../metadataItem/registry"

export interface MetadataItemOwnerContextEntry {
  itemType: MetadataItemType
  name: string
  path: string
  owner?: MetadataTargetOwner
}

export const appendMetadataItemOwner = (
  owners: readonly MetadataItemOwnerContextEntry[],
  itemType: MetadataItemType,
  name: string,
  path = "",
  owner?: MetadataTargetOwner
): MetadataItemOwnerContextEntry[] => [...owners, { itemType, name, path, ...(owner ? { owner } : {}) }]

export const metadataItemOwnersToTargetOwners = (
  owners: readonly MetadataItemOwnerContextEntry[]
): MetadataTargetOwnerContext[] =>
  owners.map(({ itemType, name, owner }) => ({ itemType, name, ...(owner ? { owner } : {}) }))

export const metadataItemOwnersToItemsTree = (
  owners: readonly MetadataItemOwnerContextEntry[]
): ContextElementToXML[] => owners.map(({ itemType, name, path }) => ({ itemType, name, path }))

export function withExportMetadataTargetOwners<TContext extends ConfigurationContext>(
  context: TContext,
  owners: readonly MetadataItemOwnerContextEntry[]
): TContext {
  if (!context.exportToYAML || owners.length === 0) return context

  return {
    ...context,
    exportToYAML: {
      ...context.exportToYAML,
      metadataTargetOwners: [
        ...(context.exportToYAML.metadataTargetOwners ?? []),
        ...metadataItemOwnersToTargetOwners(owners),
      ],
    },
  }
}

export function withImportMetadataTargetOwners<TContext extends ConfigurationContext>(
  context: TContext,
  owners: readonly MetadataItemOwnerContextEntry[]
): TContext {
  if (owners.length === 0) return context

  return {
    ...context,
    importFromYAML: {
      ...context.importFromYAML,
      metadataTargetOwners: [
        ...(context.importFromYAML?.metadataTargetOwners ?? []),
        ...metadataItemOwnersToTargetOwners(owners),
      ],
    },
  }
}

export function withExportToXMLItemsTree<TContext extends ConfigurationContextWithExportToXML>(
  context: TContext,
  owners: readonly MetadataItemOwnerContextEntry[]
): TContext {
  if (owners.length === 0) return context

  return {
    ...context,
    exportToXML: {
      ...context.exportToXML,
      itemsTree: [...context.exportToXML.itemsTree, ...metadataItemOwnersToItemsTree(owners)],
    },
  }
}
