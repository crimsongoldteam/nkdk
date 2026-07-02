import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
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

registerTypeRule("boolean", "exportToYAML", exportBooleanToYAML)
