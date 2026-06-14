import { Context } from "vm"
import { parseMetadataTargetFromYAML } from "~/metadata/commonObjects/metadataTargets"
import type { MetadataTargetConstraint } from "~/metadata/commonObjects/metadataTargets/types"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { convertPath } from "./helper"
import { MetadataFieldsRules, MetadataFieldsRulesFromYAML, MetadataValuesRulesFromYAML } from "./types"

// export const importMetadataTypeStringFromYAML = (_context: Context, name: string): string | undefined => {
//   return convertPath(MetadataTypesRulesFromYAML, name)
// }

const metadataObjectTargetFallback = { kind: "object" } as const satisfies MetadataTargetConstraint
const metadataFieldTargetFallback = { kind: "field", owner: "explicit" } as const satisfies MetadataTargetConstraint
const metadataValueTargetFallback = {
  kind: "value",
  valueKinds: ["predefinedValue", "enumValue", "emptyRef"],
  allowEmptyRef: true,
} as const satisfies MetadataTargetConstraint

const MetadataRootFieldsRulesFromYAML: MetadataFieldsRules = {
  ОбщаяКоманда: { name: "CommonCommand" },
  ...MetadataFieldsRulesFromYAML,
}

const MetadataRootValuesRulesFromYAML: MetadataFieldsRules = {
  ...MetadataRootFieldsRulesFromYAML,
  ...MetadataValuesRulesFromYAML,
}

export const importMetadataFieldStringFromYAML = (
  _context: Context,
  rule: PropertyRule | undefined,
  name: string
): string | undefined => {
  return parseMetadataTargetStringFromYAML({
    name,
    constraint: metadataTargetForRule(rule, metadataFieldTargetFallback),
    legacy: () => convertPath(MetadataRootFieldsRulesFromYAML, name),
    rule,
  })
}

export const importMetadataObjectStringFromYAML = (
  _context: Context,
  rule: PropertyRule | undefined,
  name: string
): string | undefined => {
  return parseMetadataTargetStringFromYAML({
    name,
    constraint: metadataTargetForRule(rule, metadataObjectTargetFallback),
    legacy: () => convertPath(MetadataRootFieldsRulesFromYAML, name),
    rule,
  })
}

export const importMetadataValueStringFromYAML = (
  _context: Context,
  rule: PropertyRule | undefined,
  name: string
): string | undefined => {
  return parseMetadataTargetStringFromYAML({
    name,
    constraint: metadataTargetForRule(rule, metadataValueTargetFallback),
    legacy: () => {
      const convertedPath = convertPath(MetadataRootValuesRulesFromYAML, name)

      if (convertedPath && convertedPath.startsWith("Enum.")) {
        const parts = convertedPath.split(".")
        if (!parts.includes("EnumValue") && parts.length >= 3) {
          const lastPart = parts[parts.length - 1]
          if (lastPart !== "EmptyRef") {
            parts.pop()
            parts.push("EnumValue", lastPart)
            return parts.join(".")
          }
        }
      }

      return convertedPath
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

function parseMetadataTargetStringFromYAML(params: {
  name: string
  constraint: MetadataTargetConstraint
  legacy: () => string
  rule: PropertyRule | undefined
}): string | undefined {
  const { name, constraint, legacy, rule } = params
  if (rule === undefined) return legacy()
  if (isCompatibilityRule(rule)) return legacy()

  const result = parseMetadataTargetFromYAML({ value: name, constraint })
  if (result.ok) return result.canonical
  if (!name.includes(".")) return undefined

  throw new Error(result.message)
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
