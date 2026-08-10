import type { PropertyRule } from "../../ruleRuntime/property/types"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import type { StringboolYAML } from "./types"

export const exportBooleanToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: boolean | undefined
): StringboolYAML | undefined => {
  if (value === undefined) return undefined
  return value ? "Истина" : "Ложь"
}

export const metadataPropertyRule000 = definePropertyTypeRule("boolean", "exportToYAML", exportBooleanToYAML)
