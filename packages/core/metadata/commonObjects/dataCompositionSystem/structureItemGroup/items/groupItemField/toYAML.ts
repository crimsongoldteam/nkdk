import type { ConfigurationContext } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import type { GroupItemField, GroupItemFieldYAML } from "./types"

const groupTypeToYAML = {
  Items: "Элементы",
  Hierarchy: "Иерархия",
} as const

const periodAdditionTypeToYAML = {
  None: "Нет",
  Items: "Элементы",
  Hierarchy: "Иерархия",
} as const

const isDefaultGroupItemField = (value: GroupItemField): boolean =>
  value.use !== false &&
  (value.groupType === undefined || value.groupType === "Items") &&
  (value.periodAdditionType === undefined || value.periodAdditionType === "None") &&
  value.periodAdditionBegin === undefined &&
  value.periodAdditionEnd === undefined

export const exportGroupItemFieldToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: GroupItemField | undefined
): GroupItemFieldYAML | undefined => {
  if (value == null) return undefined
  if (isDefaultGroupItemField(value)) return value.field

  return {
    Поле: value.field,
    ...(value.use === false ? { Использование: "Ложь" as const } : {}),
    ...(value.groupType !== undefined && value.groupType !== "Items" ? { ТипГруппировки: groupTypeToYAML[value.groupType] } : {}),
    ...(value.periodAdditionType !== undefined && value.periodAdditionType !== "None"
      ? { ТипДополнения: periodAdditionTypeToYAML[value.periodAdditionType] }
      : {}),
    ...(value.periodAdditionBegin !== undefined ? { НачалоПериода: value.periodAdditionBegin } : {}),
    ...(value.periodAdditionEnd !== undefined ? { КонецПериода: value.periodAdditionEnd } : {}),
  }
}

registerTypeRule("GroupItemField", "exportToYAML", exportGroupItemFieldToYAML)
