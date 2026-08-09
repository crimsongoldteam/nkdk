import type { ConfigurationContext } from "../../../../../context/types"
import type { PropertyRule } from "../../../../../orchestration/property/types"
import { registerTypeRule } from "../../../../../orchestration/property/typeRuleRegistry"
import type { GroupItemAuto, GroupItemAutoYAML } from "./types"

export const exportGroupItemAutoToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: GroupItemAuto | undefined
): GroupItemAutoYAML | undefined => {
  if (value == null) return undefined
  return value.use === false ? "([Авто])" : "[Авто]"
}

registerTypeRule("GroupItemAuto", "exportToYAML", exportGroupItemAutoToYAML)
