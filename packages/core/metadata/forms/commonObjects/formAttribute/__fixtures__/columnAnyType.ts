import type { FormAttributes } from "../types"

export const columnAnyType = [
  {
    name: "ТаблицаСКолонкойБезТипа",
    title: { items: { ru: "Таблица с колонкой без типа" } },
    type: { type: ["ValueTable"] },
    columns: [
      {
        name: "РеквизитБезТипа",
        title: { items: { ru: "Реквизит без типа" } },
        itemType: "FormAttributeColumn",
      },
    ],
    itemType: "FormAttribute",
  },
] as const satisfies FormAttributes
