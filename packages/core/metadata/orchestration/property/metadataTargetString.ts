import { formatMetadataTargetToYAML, parseMetadataTargetFromYAML } from "~/metadata/commonObjects/metadataTargets"
import type { ConfigurationContext } from "~/metadata/context/types"
import { rootFromYAML } from "~/metadata/commonObjects/metadataTargets/roots"
import type {
  MetadataRootName,
  MetadataTargetConstraint,
  MetadataTargetOwner,
} from "~/metadata/commonObjects/metadataTargets/types"
import type { MetadataItemRule, PropertyRule } from "./types"

export function metadataTargetOwnerFromRule(params: {
  itemRule: MetadataItemRule
  name: string | undefined
  context?: ConfigurationContext
}): MetadataTargetOwner | undefined {
  const nestedOwner = metadataTargetNestedOwnerFromRule(params)
  if (nestedOwner) return nestedOwner

  const prefix = params.itemRule.itemTypePrefix
  if (!prefix || !params.name) return undefined

  const root = rootFromYAML[prefix] ?? itemTypePrefixRootFallback[prefix]
  return root ? { root, objectName: params.name } : undefined
}

export function exportStringMetadataTargetToYAML(params: {
  rule: PropertyRule
  value: unknown
  owner: MetadataTargetOwner | undefined
}): unknown {
  const value = params.value
  const constraint = params.rule.metadataTarget
  if (typeof value !== "string" || value === "" || !isSupportedStringMetadataTarget(constraint)) return value
  if (requiresCurrentOwner(constraint) && !params.owner) return value

  return formatMetadataTargetToYAML({
    canonical: value,
    constraint,
    owner: params.owner,
  })
}

export function importStringMetadataTargetFromYAML(params: {
  rule: PropertyRule
  value: unknown
  owner: MetadataTargetOwner | undefined
}): unknown {
  const value = params.value
  const constraint = params.rule.metadataTarget
  if (typeof value !== "string" || value === "" || !isSupportedStringMetadataTarget(constraint)) return value
  if (requiresCurrentOwner(constraint) && !params.owner) return value

  const result = parseMetadataTargetFromYAML({
    value,
    constraint,
    owner: params.owner,
  })
  if (!result.ok) throw new Error(result.message)
  return result.canonical
}

const itemTypePrefixRootFallback: Partial<Record<string, MetadataRootName>> = {
  Нумератор: "DocumentNumerator",
}

function metadataTargetNestedOwnerFromRule(params: {
  itemRule: MetadataItemRule
  name: string | undefined
  context?: ConfigurationContext
}): MetadataTargetOwner | undefined {
  const owners =
    params.context?.importFromYAML?.metadataTargetOwners ?? params.context?.exportToYAML?.metadataTargetOwners ?? []
  const current = findLastOwner(owners, params.itemRule.itemType)
  const currentName = current?.name ?? params.name
  if (!currentName) return undefined

  const externalDataSource = findLastOwner(owners, "MetadataExternalDataSource")
  if (!externalDataSource) return undefined

  if (params.itemRule.itemType === "MetadataExternalDataSourceDimensionTable") {
    const cube = findLastOwner(owners, "MetadataExternalDataSourceCube")
    if (!cube) return undefined

    return {
      root: "ExternalDataSource",
      objectName: `${externalDataSource.name}.Cube.${cube.name}.DimensionTable.${currentName}`,
    }
  }

  if (params.itemRule.itemType === "MetadataExternalDataSourceCube") {
    return {
      root: "ExternalDataSource",
      objectName: `${externalDataSource.name}.Cube.${currentName}`,
    }
  }

  if (params.itemRule.itemType !== "MetadataExternalDataSourceTable") return undefined

  return {
    root: "ExternalDataSource",
    objectName: `${externalDataSource.name}.Table.${currentName}`,
  }
}

function findLastOwner(
  owners: readonly { itemType: string; name: string }[],
  itemType: string
): { itemType: string; name: string } | undefined {
  for (let index = owners.length - 1; index >= 0; index--) {
    const owner = owners[index]
    if (owner.itemType === itemType) return owner
  }

  return undefined
}

function isSupportedStringMetadataTarget(
  constraint: MetadataTargetConstraint | undefined
): constraint is Extract<MetadataTargetConstraint, { kind: "member" }> {
  if (!constraint) return false
  return constraint.kind === "member"
}

function requiresCurrentOwner(constraint: Extract<MetadataTargetConstraint, { kind: "member" }>): boolean {
  return constraint.owner === "this"
}
