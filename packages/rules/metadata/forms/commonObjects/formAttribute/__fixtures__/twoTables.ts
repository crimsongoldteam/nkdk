import type { FormAttributes } from "../types"

export const twoTables = [
  {
    name: "Таблица1",
    title: { items: { ru: "Таблица1" } },
    type: { type: ["ValueTable"] },
    columns: [
      {
        name: "Колонка1Таблицы1",
        title: { items: { ru: "Колонка1 таблицы1" } },
        type: { type: ["string"] },
        itemType: "FormAttributeColumn",
      },
    ],
    itemType: "FormAttribute",
  },
  {
    name: "Таблица2",
    title: { items: { ru: "Таблица2" } },
    type: { type: ["ValueTable"] },
    columns: [
      {
        name: "Колонка2Таблицы2",
        title: { items: { ru: "Колонка2 таблицы2" } },
        type: { type: ["string"] },
        itemType: "FormAttributeColumn",
      },
    ],
    itemType: "FormAttribute",
  },
] as const satisfies FormAttributes
