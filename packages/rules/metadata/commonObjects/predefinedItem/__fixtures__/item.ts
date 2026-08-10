import type { PredefinedItem, PredefinedItemCollectionYAML } from "../types"

// Corresponds to __fixtures__/item.xml (non-default values only, after import stripping)
export const item = {
  itemType: "PredefinedItem" as const,
  name: "Предопределенный2",
  code: "000000002",
  description: "Наименование",
  isFolder: false,
} as const satisfies PredefinedItem

export const itemYAML = {
  Предопределенный2: {
    Код: "000000002",
    Наименование: "Наименование",
  },
} as const satisfies PredefinedItemCollectionYAML
