import type { PredefinedItem, PredefinedItemCollectionYAML } from "../types"

// Corresponds to __fixtures__/group.xml (non-default values only, after import stripping)
export const group = {
  itemType: "PredefinedItem" as const,
  name: "Группа",
  code: "000000003",
  description: "Наименование",
  isFolder: true,
  childItems: [
    {
      itemType: "PredefinedItem" as const,
      name: "Предопределенный1",
      code: "000000001",
      description: "Предопределенный1",
      isFolder: false,
    },
  ],
} as const satisfies PredefinedItem

export const groupYAML = {
  Группа: {
    Код: "000000003",
    Наименование: "Наименование",
    ЭтоГруппа: "Истина",
    Элементы: {
      Предопределенный1: {
        Код: "000000001",
        Наименование: "Предопределенный1",
      },
    },
  },
} as const satisfies PredefinedItemCollectionYAML
