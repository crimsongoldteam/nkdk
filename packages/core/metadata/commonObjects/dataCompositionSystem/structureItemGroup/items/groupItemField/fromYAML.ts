import type { ConfigurationContext } from "../../../../../context/types"
import { registerTypeRule } from "../../../../../orchestration/property/typeRuleRegistry"
import type { PropertyRule } from "../../../../../orchestration/property/types"
import {
  DataCompositionGroupTypeFromYAML,
  DataCompositionPeriodAdditionTypeFromYAML,
} from "../../../../../systemEnumerations/types"
import type { GroupItemField, GroupItemFieldYAML } from "./types"

export const importGroupItemFieldFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: GroupItemFieldYAML | undefined
): GroupItemField | undefined => {
  if (value == null) return undefined
  if (typeof value !== "string") {
    if (!value.Поле) return undefined

    return {
      itemType: "GroupItemField",
      field: value.Поле,
      ...(value.Использование === "Ложь" ? { use: false } : {}),
      ...(value.ТипГруппировки != null ? { groupType: DataCompositionGroupTypeFromYAML[value.ТипГруппировки] } : {}),
      ...(value.ТипДополнения != null
        ? { periodAdditionType: DataCompositionPeriodAdditionTypeFromYAML[value.ТипДополнения] }
        : {}),
      ...(value.НачалоПериода != null ? { periodAdditionBegin: value.НачалоПериода } : {}),
      ...(value.КонецПериода != null ? { periodAdditionEnd: value.КонецПериода } : {}),
    }
  }

  const isDisabled = value.startsWith("(") && value.endsWith(")")
  const field = isDisabled ? value.slice(1, -1) : value
  if (!field) return undefined
  return isDisabled ? { itemType: "GroupItemField", field, use: false } : { itemType: "GroupItemField", field }
}

registerTypeRule("GroupItemField", "importFromYAML", importGroupItemFieldFromYAML)
