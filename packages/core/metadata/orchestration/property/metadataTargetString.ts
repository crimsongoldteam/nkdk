import { formatMetadataTargetToYAML, parseMetadataTargetFromYAML } from "~/metadata/commonObjects/metadataTargets"
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
}): MetadataTargetOwner | undefined {
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

function isSupportedStringMetadataTarget(
  constraint: MetadataTargetConstraint | undefined
): constraint is Extract<MetadataTargetConstraint, { kind: "member" }> {
  if (!constraint) return false
  return constraint.kind === "member"
}
