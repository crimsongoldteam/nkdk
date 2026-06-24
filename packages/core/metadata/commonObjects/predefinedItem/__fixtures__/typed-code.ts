import type { PredefinedItem, PredefinedItemCollectionYAML } from "../types"

export const typedCode = {
  itemType: "PredefinedItem" as const,
  name: "Группа",
  code: 0,
  description: "Группа",
  isFolder: true,
  childItems: [
    {
      itemType: "PredefinedItem" as const,
      name: "СтроковыйКод",
      code: "0",
      description: "Строковый код",
      isFolder: false,
    },
  ],
} as const satisfies PredefinedItem

export const typedCodeYAML = {
  Группа: {
    Код: 0,
    Наименование: "Группа",
    ЭтоГруппа: "Истина",
    Элементы: {
      СтроковыйКод: {
        Код: "0",
        Наименование: "Строковый код",
      },
    },
  },
} as const satisfies PredefinedItemCollectionYAML
