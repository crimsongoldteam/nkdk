import type { FormAttributes } from "../types"

export const valueListWithReferenceEmptySettings = [
  {
    itemType: "FormAttribute",
    name: "Полномочия",
    title: { items: { ru: "" } },
    type: {
      type: ["ValueListType", "string"],
    },
    columns: [],
  },
] as const satisfies FormAttributes
