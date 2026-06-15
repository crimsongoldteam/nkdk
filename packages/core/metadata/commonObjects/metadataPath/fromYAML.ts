import { parseMetadataTargetFromYAML } from "~/metadata/commonObjects/metadataTargets"
import { isMetadataRootName, rootFromYAML } from "~/metadata/commonObjects/metadataTargets/roots"
import type { MetadataTargetConstraint } from "~/metadata/commonObjects/metadataTargets/types"
import type { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/orchestration/property/types"

const metadataObjectTargetFallback = { kind: "object" } as const satisfies MetadataTargetConstraint
const metadataFieldTargetFallback = { kind: "field", owner: "explicit" } as const satisfies MetadataTargetConstraint
const metadataValueTargetFallback = {
  kind: "value",
  valueKinds: ["predefinedValue", "enumValue", "emptyRef"],
  allowEmptyRef: true,
} as const satisfies MetadataTargetConstraint

export const importMetadataFieldStringFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  name: string
): string | undefined => {
  return parseMetadataTargetStringFromYAML(context, name, metadataTargetForRule(rule, metadataFieldTargetFallback))
}

export const importMetadataObjectStringFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  name: string
): string | undefined => {
  return parseMetadataTargetStringFromYAML(context, name, metadataTargetForRule(rule, metadataObjectTargetFallback))
}

export const importMetadataValueStringFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  name: string
): string | undefined => {
  return parseMetadataTargetStringFromYAML(context, name, metadataTargetForRule(rule, metadataValueTargetFallback))
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

function parseMetadataTargetStringFromYAML(
  context: ConfigurationContext,
  name: string,
  constraint: MetadataTargetConstraint
): string | undefined {
  const result = parseMetadataTargetFromYAML({ value: name, constraint })
  if (result.ok) return result.canonical
  if (!isMetadataTargetLikeYAML(name)) return undefined
  if (context.importFromYAML?.validateMetadataTargets === false) return name

  throw new Error(result.message)
}

function isMetadataTargetLikeYAML(value: string): boolean {
  const root = value.split(".")[0]
  return rootFromYAML[root] !== undefined || isMetadataRootName(root)
}
