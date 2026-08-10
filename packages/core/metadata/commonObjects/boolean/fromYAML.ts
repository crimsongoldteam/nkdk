import type { PropertyRule } from "../../ruleRuntime/property/types"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import type { StringboolYAML } from "./types"

export const importBooleanFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: StringboolYAML | boolean | undefined
): boolean | undefined => {
  if (value === undefined) return undefined
  if (typeof value === "boolean") return value
  return value === "Истина"
}

export const metadataPropertyRule000 = definePropertyTypeRule("boolean", "importFromYAML", importBooleanFromYAML)
