import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"

export const exportStringToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | number | undefined
): string | undefined => {
  if (value === undefined) return undefined
  return value.toString()
}

registerTypeRule("string", "exportToYAML", exportStringToYAML)
