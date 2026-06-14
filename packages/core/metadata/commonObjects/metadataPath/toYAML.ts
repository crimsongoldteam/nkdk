import { Context } from "vm"
import { formatMetadataTargetToYAML } from "~/metadata/commonObjects/metadataTargets"
import type { MetadataTargetConstraint } from "~/metadata/commonObjects/metadataTargets/types"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { convertPath } from "./helper"
import { MetadataFieldsRules, MetadataFieldsRulesToYAML, MetadataValuesRulesToYAML } from "./types"

// export const exportMetadataTypeStringToYAML = (_context: Context, name: string): string | undefined => {
//   return convertPath(MetadataTypesRulesToYAML, name)
// }

const metadataObjectTargetFallback = { kind: "object" } as const satisfies MetadataTargetConstraint
const metadataFieldTargetFallback = { kind: "field", owner: "explicit" } as const satisfies MetadataTargetConstraint
const metadataValueTargetFallback = {
  kind: "value",
  valueKinds: ["predefinedValue", "enumValue", "emptyRef"],
  allowEmptyRef: true,
} as const satisfies MetadataTargetConstraint

const MetadataRootFieldsRulesToYAML: MetadataFieldsRules = {
  CommonCommand: { name: "ОбщаяКоманда" },
  ...MetadataFieldsRulesToYAML,
}

const MetadataRootValuesRulesToYAML: MetadataFieldsRules = {
  ...MetadataRootFieldsRulesToYAML,
  ...MetadataValuesRulesToYAML,
}

export const exportMetadataFieldStringToYAML = (
  _context: Context,
  rule: PropertyRule | undefined,
  name: string
): string | undefined => {
  return formatMetadataTargetStringToYAML({
    name,
    constraint: metadataTargetForRule(rule, metadataFieldTargetFallback),
    legacy: () => convertPath(MetadataRootFieldsRulesToYAML, name),
    rule,
  })
}

export const exportMetadataObjectStringToYAML = (
  _context: Context,
  rule: PropertyRule | undefined,
  name: string
): string | undefined => {
  return formatMetadataTargetStringToYAML({
    name,
    constraint: metadataTargetForRule(rule, metadataObjectTargetFallback),
    legacy: () => convertPath(MetadataRootFieldsRulesToYAML, name),
    rule,
  })
}

export const exportMetadataValueStringToYAML = (
  _context: Context,
  rule: PropertyRule | undefined,
  name: string | undefined
): string | undefined => {
  if (!name) return undefined

  return formatMetadataTargetStringToYAML({
    name,
    constraint: metadataTargetForRule(rule, metadataValueTargetFallback),
    legacy: () => {
      let processedPath = name
      if (name.startsWith("Enum.")) {
        const parts = name.split(".")
        const filteredParts = parts.filter((part) => part !== "EnumValue")
        processedPath = filteredParts.join(".")
      }

      return convertPath(MetadataRootValuesRulesToYAML, processedPath)
    },
    rule,
  })
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

function formatMetadataTargetStringToYAML(params: {
  name: string
  constraint: MetadataTargetConstraint
  legacy: () => string
  rule: PropertyRule | undefined
}): string | undefined {
  const { name, constraint, legacy, rule } = params
  if (rule === undefined) return legacy()
  if (isCompatibilityRule(rule)) return legacy()
  if (!name.includes(".")) return undefined

  return formatMetadataTargetToYAML({ canonical: name, constraint })
}

function isCompatibilityRule(rule: PropertyRule): boolean {
  if (rule.metadataTarget !== undefined) return false

  return (
    rule.type === "MetadataItemLink" ||
    rule.type === "MetadataItemLinks" ||
    rule.type === "MetadataField" ||
    rule.type === "MetadataFields"
  )
}
