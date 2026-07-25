import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
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

registerTypeRule("boolean", "importFromYAML", importBooleanFromYAML)
