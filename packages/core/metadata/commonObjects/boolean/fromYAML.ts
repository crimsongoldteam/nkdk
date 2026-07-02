import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import type { StringboolYAML } from "./types"

export const importBooleanFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: StringboolYAML | undefined
): boolean | undefined => {
  if (value === undefined) return undefined
  return value === "Истина"
}

registerTypeRule("boolean", "importFromYAML", importBooleanFromYAML)
