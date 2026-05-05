import type { ConfigurationContext } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import type { GroupItemField, GroupItemFieldYAML } from "./types"

export const importGroupItemFieldFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: GroupItemFieldYAML | undefined
): GroupItemField | undefined => {
  if (typeof value !== "string") return undefined
  const isDisabled = value.startsWith("(") && value.endsWith(")")
  const field = isDisabled ? value.slice(1, -1) : value
  if (!field) return undefined
  return isDisabled ? { itemType: "GroupItemField", field, use: false } : { itemType: "GroupItemField", field }
}

registerTypeRule("GroupItemField", "importFromYAML", importGroupItemFieldFromYAML)
