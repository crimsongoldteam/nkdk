import type { GroupItem, GroupItemField, GroupItemFieldYAML } from "../types"

export const dynamicListGroupItemField = {
  itemType: "GroupItemField",
  use: false,
  field: "Наименование",
} as const satisfies GroupItemField

export const dynamicListGroupItems = [dynamicListGroupItemField] as const satisfies GroupItem

export const dynamicListGroupItemFieldYAML = ["(Наименование)"] as const satisfies GroupItemFieldYAML
