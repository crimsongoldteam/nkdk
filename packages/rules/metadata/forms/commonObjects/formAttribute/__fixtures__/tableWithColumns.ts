import type { FormAttributes } from "../types"

export const tableWithColumns = [
  {
    name: "Таблица",
    title: { items: { ru: "" } },
    type: { type: ["ValueTable"] },
    columns: [
      {
        name: "Колонка1",
        type: { type: ["boolean"] },
        itemType: "FormAttributeColumn",
      },
      {
        name: "Колонка2",
        type: { type: ["boolean"] },
        itemType: "FormAttributeColumn",
      },
    ],
    itemType: "FormAttribute",
  },
] as const satisfies FormAttributes
