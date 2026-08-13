import {
  formatMetadataTargetToYAML,
  parseMetadataTargetFromModel,
  parseMetadataTargetFromYAML,
} from "../metadataTarget"
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

  try {
    return formatMetadataTargetToYAML({
      canonical: value,
      constraint: metadataTargetConstraintForOwner(constraint, params.owner),
      owner: params.owner,
    })
  } catch (error) {
    if (isTranslateOnlyConstraint(constraint)) return value
    throw error
  }
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
    constraint: metadataTargetConstraintForOwner(constraint, params.owner),
    owner: params.owner,
  })
  if (!result.ok) {
    if (isTranslateOnlyConstraint(constraint)) {
      const modelResult = parseMetadataTargetFromModel({
        canonical: value,
        constraint: metadataTargetConstraintForOwner(constraint, params.owner),
        owner: params.owner,
      })
      if (!modelResult.ok) return value
    }
    throw new Error(result.message)
  }
  return result.canonical
}

export function metadataTargetOwnerFromTypeYAML(value: unknown): MetadataTargetOwner | undefined {
  if (typeof value !== "string" || value === "") return undefined
  const parsed = parseMetadataTargetFromYAML({ value, constraint: { kind: "object" } })
  if (!parsed.ok || parsed.target.kind !== "object" || (parsed.target.segments?.length ?? 0) > 0) return undefined
  return { root: parsed.target.root, objectName: parsed.target.objectName }
}

export function metadataTargetOwnerForProperty(params: {
  rule: { readonly metadataTarget?: MetadataTargetConstraint }
  siblingValue: (propertyKey: string) => unknown
  owner: MetadataTargetOwner | undefined
}): MetadataTargetOwner | undefined {
  const constraint = params.rule.metadataTarget
  if (constraint?.kind !== "member" || constraint.owner !== "type") return params.owner
  if (constraint.typeProperty === undefined) return undefined
  return metadataTargetOwnerFromTypeYAML(params.siblingValue(constraint.typeProperty))
}

export function metadataTargetConstraintForOwner(
  constraint: MetadataTargetConstraint,
  owner: MetadataTargetOwner | undefined,
): MetadataTargetConstraint {
  if (constraint.kind !== "member" || constraint.owner !== "type") return constraint
  const { typeProperty: _typeProperty, ...rest } = constraint
  return { ...rest, owner: owner === undefined ? "explicit" : "this" }
}

function supportsGenericStringMetadataTarget(rule: PropertyRule): boolean {
  return rule.type === "string" || rule.type === "IndexField" || rule.type === "FunctionalOptionsProperty"
}

function isTranslateOnlyConstraint(constraint: MetadataTargetConstraint): boolean {
  return (constraint.kind === "dataTable" || constraint.kind === "dataTableField")
    && constraint.validation === "translateOnly"
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
