import type { ConfigurationContext } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import type { GroupItemField, GroupItemFieldYAML } from "./types"

export const exportGroupItemFieldToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: GroupItemField | undefined
): GroupItemFieldYAML | undefined => {
  if (value == null) return undefined
  return value.use === false ? `(${value.field})` : value.field
}

registerTypeRule("GroupItemField", "exportToYAML", exportGroupItemFieldToYAML)
