import { formatMetadataTargetToYAML } from "~/metadata/commonObjects/metadataTargets"
import { isMetadataRootName } from "~/metadata/commonObjects/metadataTargets/roots"
import type { MetadataTargetConstraint, MetadataTargetOwner } from "~/metadata/commonObjects/metadataTargets/types"
import type { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/orchestration/property/types"

const metadataObjectTargetFallback = { kind: "object" } as const satisfies MetadataTargetConstraint
const metadataFieldTargetFallback = { kind: "member", owner: "explicit" } as const satisfies MetadataTargetConstraint
const metadataValueTargetFallback = {
  kind: "value",
  valueKinds: ["predefinedValue", "enumValue", "emptyRef"],
  allowEmptyRef: true,
} as const satisfies MetadataTargetConstraint

export const exportMetadataFieldStringToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  name: string,
  owner?: MetadataTargetOwner
): string | undefined => {
  return formatMetadataTargetStringToYAML(context, name, metadataTargetForRule(rule, metadataFieldTargetFallback), owner)
}

export const exportMetadataObjectStringToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  name: string,
  owner?: MetadataTargetOwner
): string | undefined => {
  return formatMetadataTargetStringToYAML(context, name, metadataTargetForRule(rule, metadataObjectTargetFallback), owner)
}

export const exportMetadataValueStringToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  name: string | undefined
): string | undefined => {
  if (!name) return undefined

  return formatMetadataTargetStringToYAML(context, name, metadataTargetForRule(rule, metadataValueTargetFallback))
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

function formatMetadataTargetStringToYAML(
  context: ConfigurationContext,
  name: string,
  constraint: MetadataTargetConstraint,
  owner?: MetadataTargetOwner
): string | undefined {
  try {
    return formatMetadataTargetToYAML({ canonical: name, constraint, owner })
  } catch (error) {
    if (context.exportToYAML?.validateMetadataTargets === false && isMetadataTargetLikeModel(name)) return name
    if (isMetadataTargetLikeModel(name)) throw error
    return undefined
  }
}

function isMetadataTargetLikeModel(value: string): boolean {
  const root = value.split(".")[0]
  return isMetadataRootName(root)
}
