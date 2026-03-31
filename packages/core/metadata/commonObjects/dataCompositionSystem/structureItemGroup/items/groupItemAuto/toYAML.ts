import type { ConfigurationContext } from "~/metadata/context/types"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import type { GroupItemAuto, GroupItemAutoYAML } from "./types"

export const exportGroupItemAutoToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: GroupItemAuto | undefined
): GroupItemAutoYAML | undefined => {
  if (value == null) return undefined
  return value.use === false ? "([Авто])" : "[Авто]"
}
