import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "@nkdk/runtime"

export const exportStringToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | number | undefined
): string | undefined => {
  if (value === undefined) return undefined
  return value.toString()
}

export const metadataPropertyRule000 = definePropertyTypeRule("string", "exportToYAML", exportStringToYAML)
