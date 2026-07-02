import { formatMetadataTargetToYAML } from "~/metadata/commonObjects/metadataTargets"
import { isMetadataRootName } from "~/metadata/commonObjects/metadataTargets/roots"
import type { MetadataTargetConstraint, MetadataTargetOwner } from "~/metadata/commonObjects/metadataTargets/types"
import type { ConfigurationContext } from "~/metadata/context/types"
import type { PropertyRule } from "~/metadata/orchestration/property/types"

const metadataObjectTargetFallback = { kind: "object" } as const satisfies MetadataTargetConstraint
const metadataFieldTargetFallback = { kind: "member", owner: "explicit" } as const satisfies MetadataTargetConstraint
const metadataValueTargetFallback = {
  kind: "value",
  valueKinds: ["predefinedValue", "enumValue", "emptyRef"],
  allowEmptyRef: true,
} as const satisfies MetadataTargetConstraint

export const exportMetadataFieldStringToYAML = (
  _context: ConfigurationContext,
  rule: PropertyRule | undefined,
  name: string,
  owner?: MetadataTargetOwner
): string | undefined => {
  return formatMetadataTargetStringToYAML(name, metadataTargetForRule(rule, metadataFieldTargetFallback), owner, isStrictObjectTargetRule(rule))
}

export const exportMetadataObjectStringToYAML = (
  _context: ConfigurationContext,
  rule: PropertyRule | undefined,
  name: string,
  owner?: MetadataTargetOwner
): string | undefined => {
  return formatMetadataTargetStringToYAML(name, metadataTargetForRule(rule, metadataObjectTargetFallback), owner, isStrictObjectTargetRule(rule))
}

export const exportMetadataValueStringToYAML = (
  _context: ConfigurationContext,
  rule: PropertyRule | undefined,
  name: string | undefined
): string | undefined => {
  if (!name) return undefined

  return formatMetadataTargetStringToYAML(name, metadataTargetForRule(rule, metadataValueTargetFallback))
}

function metadataTargetForRule(
  rule: PropertyRule | undefined,
  fallback: MetadataTargetConstraint
): MetadataTargetConstraint {
  if (rule?.metadataTarget) return rule.metadataTarget
  if (rule?.type === "MetadataItemLink" || rule?.type === "MetadataItemLinks") return metadataObjectTargetFallback
  if (rule?.type === "MetadataField" || rule?.type === "MetadataFields") return metadataFieldTargetFallback

  return fallback
}

function isStrictObjectTargetRule(rule: PropertyRule | undefined): boolean {
  return rule?.metadataTarget?.kind === "object"
}

function formatMetadataTargetStringToYAML(
  name: string,
  constraint: MetadataTargetConstraint,
  owner?: MetadataTargetOwner,
  strict = false
): string | undefined {
  try {
    return formatMetadataTargetToYAML({ canonical: name, constraint, owner })
  } catch (error) {
    if (strict) throw error
    if (isMetadataTargetLikeModel(name)) throw error
    return undefined
  }
}

function isMetadataTargetLikeModel(value: string): boolean {
  const root = value.split(".")[0]
  return isMetadataRootName(root)
}
