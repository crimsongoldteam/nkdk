import { GroupItemField, GroupItemFieldYAML } from "../types"

export const dynamicListGroupItemFieldUseFalse = {
  itemType: "GroupItemField",
  use: false,
  field: "Наименование",
} as const satisfies GroupItemField

export const dynamicListGroupItemFieldDefault = {
  itemType: "GroupItemField",
  field: "Наименование",
} as const satisfies GroupItemField

export const dynamicListGroupItemFieldUseFalseLegacyYAML = "(Наименование)" as const satisfies GroupItemFieldYAML

export const dynamicListGroupItemFieldUseFalseYAML = {
  Поле: "Наименование",
  Использование: "Ложь",
} as const satisfies GroupItemFieldYAML

export const dynamicListGroupItemFieldDefaultYAML = "Наименование" as const satisfies GroupItemFieldYAML
