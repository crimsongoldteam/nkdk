import type { ConfigurationContext } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import type { GroupItemField, GroupItemFieldYAML } from "./types"

const groupTypeFromYAML = {
  Элементы: "Items",
  Иерархия: "Hierarchy",
} as const

const periodAdditionTypeFromYAML = {
  Нет: "None",
  Элементы: "Items",
  Иерархия: "Hierarchy",
} as const

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
      ...(value.ТипГруппировки != null ? { groupType: groupTypeFromYAML[value.ТипГруппировки] } : {}),
      ...(value.ТипДополнения != null ? { periodAdditionType: periodAdditionTypeFromYAML[value.ТипДополнения] } : {}),
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
