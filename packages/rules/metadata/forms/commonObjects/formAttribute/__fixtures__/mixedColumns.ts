import type { FormAttributes } from "../types"

export const mixedColumns = [
  {
    name: "График",
    title: { items: { ru: "" } },
    type: { type: ["ValueTable"] },
    columns: [
      {
        name: "Отступ",
        title: { items: { ru: "Отступ" } },
        type: { type: ["string"] },
        itemType: "FormAttributeColumn",
      },
    ],
    additionalColumns: [
      {
        table: "ГрафикНачислений",
        columns: [
          {
            name: "Сумма",
            title: { items: { ru: "Сумма" } },
            type: {
              type: ["decimal"],
              numberQualifiers: { digits: 10, fractionDigits: 2, allowedSign: "Any" },
            },
            itemType: "FormAttributeColumn",
          },
        ],
      },
    ],
    itemType: "FormAttribute",
  },
] as const satisfies FormAttributes
