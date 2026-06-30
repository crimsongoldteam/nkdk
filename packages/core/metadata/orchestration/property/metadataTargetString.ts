import { formatMetadataTargetToYAML, parseMetadataTargetFromYAML } from "~/metadata/commonObjects/metadataTargets"
import type { ConfigurationContext } from "~/metadata/context/types"
import type { MetadataTargetConstraint, MetadataTargetOwner } from "~/metadata/commonObjects/metadataTargets/types"
import { getMetadataTargetOwnerResolver, type MetadataTargetOwnerFrame } from "./metadataTargetOwnerRegistry"
import type { MetadataItemRule, PropertyRule } from "./types"

export function metadataTargetOwnerFromRule(params: {
  itemRule: MetadataItemRule
  name: string | undefined
  context?: ConfigurationContext
}): MetadataTargetOwner | undefined {
  const frames = metadataTargetOwnerFrames(params.context)
  const resolver = getMetadataTargetOwnerResolver(params.itemRule.itemType)
  if (resolver) {
    const resolved = resolver({ itemRule: params.itemRule, name: params.name, frames, context: params.context })
    if (resolved) return resolved
  }

  const declaration = params.itemRule.metadataTargetOwner
  if (declaration?.kind === "inherit") return lastResolvedOwner(frames)
  if (declaration?.kind === "self") {
    return params.name ? { root: declaration.root, objectName: params.name } : undefined
  }

  return undefined
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

function lastResolvedOwner(frames: readonly MetadataTargetOwnerFrame[]): MetadataTargetOwner | undefined {
  for (let index = frames.length - 1; index >= 0; index--) {
    const owner = frames[index].owner
    if (owner) return owner
  }
  return undefined
}

function isSupportedStringMetadataTarget(
  constraint: MetadataTargetConstraint | undefined
): constraint is Extract<MetadataTargetConstraint, { kind: "member" | "object" }> {
  if (!constraint) return false
  return constraint.kind === "member" || constraint.kind === "object"
}
