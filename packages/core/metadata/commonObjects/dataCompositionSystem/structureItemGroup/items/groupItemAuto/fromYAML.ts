import type { ConfigurationContext } from "../../../../../context/types"
import type { PropertyRule } from "../../../../../orchestration/property/types"
import type { GroupItemAuto, GroupItemAutoYAML } from "./types"

export const importGroupItemAutoFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: GroupItemAutoYAML | undefined
): GroupItemAuto | undefined => {
  if (value === "[Авто]") return { itemType: "GroupItemAuto" }
  if (value === "([Авто])") return { itemType: "GroupItemAuto", use: false }
  return undefined
}
