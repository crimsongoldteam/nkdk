import { formatMetadataTargetToYAML, parseMetadataTargetFromYAML } from "../../commonObjects/metadataTargets"
import type { ConfigurationContext } from "../../context/types"
import type { MetadataTargetConstraint, MetadataTargetOwner } from "../../commonObjects/metadataTargets/types"
import type { MetadataTargetOwnerFrame } from "./metadataTargetOwnerRegistry"
import { resolveTopologyMetadataTargetOwner } from "../../resourceTopology/metadataTargetOwner"
import type { MetadataItemRule, PropertyRule } from "./types"

export function metadataTargetOwnerFromRule(params: {
  itemRule: MetadataItemRule
  name: string | undefined
  context?: ConfigurationContext
}): MetadataTargetOwner | undefined {
  const frames = metadataTargetOwnerFrames(params.context)
  return metadataTargetOwnerFromFrames({ ...params, frames })
}

export function metadataTargetOwnerFromFrames(params: {
  itemRule: MetadataItemRule
  name: string | undefined
  frames: readonly MetadataTargetOwnerFrame[]
  context?: ConfigurationContext
}): MetadataTargetOwner | undefined {
  return resolveTopologyMetadataTargetOwner(params) as MetadataTargetOwner | undefined
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

function metadataTargetOwnerFrames(context: ConfigurationContext | undefined): readonly MetadataTargetOwnerFrame[] {
  return context?.importFromYAML?.metadataTargetOwners ?? context?.exportToYAML?.metadataTargetOwners ?? []
}

function isSupportedStringMetadataTarget(
  constraint: MetadataTargetConstraint | undefined
): constraint is Extract<MetadataTargetConstraint, { kind: "member" | "object" }> {
  if (!constraint) return false
  return constraint.kind === "member" || constraint.kind === "object"
}
