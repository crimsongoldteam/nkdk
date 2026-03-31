import type { GroupItem, GroupItemField, GroupItemYAML } from "../types"

export const dynamicListGroupItemFieldUseFalse = {
  itemType: "GroupItemField",
  use: false,
  field: "Наименование",
} as const satisfies GroupItemField

export const dynamicListGroupItemFieldDefault = {
  itemType: "GroupItemField",
  field: "Наименование",
} as const satisfies GroupItemField

export const dynamicListGroupItemsUseFalse = [dynamicListGroupItemFieldUseFalse] as const satisfies GroupItem

export const dynamicListGroupItemsDefault = [dynamicListGroupItemFieldDefault] as const satisfies GroupItem

export const dynamicListGroupItemsUseFalseYAML = ["(Наименование)"] as const satisfies GroupItemYAML

export const dynamicListGroupItemsDefaultYAML = ["Наименование"] as const satisfies GroupItemYAML
