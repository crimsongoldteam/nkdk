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

export const dynamicListGroupItemFieldUseFalseYAML = "(Наименование)" as const satisfies GroupItemFieldYAML

export const dynamicListGroupItemFieldDefaultYAML = "Наименование" as const satisfies GroupItemFieldYAML
