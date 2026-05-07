import type { FormAttributes } from "../types"

export const titleColumnsType = [
  {
    name: "Таблица",
    title: { items: { ru: "Таблица" } },
    type: { type: ["ValueTable"] },
    columns: [
      {
        name: "Колонка",
        type: { type: ["boolean"] },
        itemType: "FormAttributeColumn",
      },
    ],
    itemType: "FormAttribute",
  },
] as const satisfies FormAttributes
