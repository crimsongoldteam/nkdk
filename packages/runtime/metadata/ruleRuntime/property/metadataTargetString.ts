import { formatMetadataTargetToYAML, parseMetadataTargetFromYAML } from "../metadataTarget"
import type { ConfigurationContext } from "../../context/types"
import type { MetadataTargetConstraint, MetadataTargetOwner } from "../metadataTarget/types"
import { getMetadataTargetOwnerResolver, type MetadataTargetOwnerFrame } from "./metadataTargetOwnerRegistry"
import type { MetadataItemRule, PropertyRule } from "./types"
import type { PropertyRuleExecution } from "./fn"

export function metadataTargetOwnerFromRule(params: {
  itemRule: MetadataItemRule
  name: string | undefined
  context?: ConfigurationContext
  execution?: PropertyRuleExecution
}): MetadataTargetOwner | undefined {
  const frames = metadataTargetOwnerFrames(params.context)
  return metadataTargetOwnerFromFrames({ ...params, frames })
}

export function metadataTargetOwnerFromFrames(params: {
  itemRule: MetadataItemRule
  name: string | undefined
  frames: readonly MetadataTargetOwnerFrame[]
  context?: ConfigurationContext
  execution?: PropertyRuleExecution
}): MetadataTargetOwner | undefined {
  const currentFrame = params.frames.at(-1)
  if (currentFrame?.itemType === params.itemRule.itemType && currentFrame.name === params.name) {
    return currentFrame.owner
  }
  const resolver = params.execution === undefined
    ? getMetadataTargetOwnerResolver(params.itemRule.itemType)
    : params.execution.getMetadataTargetOwnerResolver(params.itemRule.itemType)
  if (resolver) {
    const resolved = resolver(params)
    if (resolved) return resolved
  }

  const declaration = params.itemRule.metadataTargetOwner
  if (declaration?.kind === "inherit") return lastResolvedOwner(params.frames)
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
  if (!supportsGenericStringMetadataTarget(params.rule) || !isSupportedStringMetadataTarget(constraint)) return value

  if (Array.isArray(value)) {
    return value.map((item) => exportStringMetadataTargetToYAML({ ...params, value: item }))
  }
  if (typeof value !== "string" || value === "") return value

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
  if (!supportsGenericStringMetadataTarget(params.rule) || !isSupportedStringMetadataTarget(constraint)) return value

  if (Array.isArray(value)) {
    return value.map((item) => importStringMetadataTargetFromYAML({ ...params, value: item }))
  }
  if (typeof value !== "string" || value === "") return value

  const result = parseMetadataTargetFromYAML({
    value,
    constraint,
    owner: params.owner,
  })
  if (!result.ok) throw new Error(result.message)
  return result.canonical
}

function supportsGenericStringMetadataTarget(rule: PropertyRule): boolean {
  return rule.type === "string" || rule.type === "IndexField"
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
): constraint is Extract<MetadataTargetConstraint, { kind: "member" | "object" | "dataTable" | "dataTableField" }> {
  if (!constraint) return false
  return constraint.kind === "member"
    || constraint.kind === "object"
    || constraint.kind === "dataTable"
    || constraint.kind === "dataTableField"
}
