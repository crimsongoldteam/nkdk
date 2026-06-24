import type { FormAttributes } from "../types"

export const attributeAnyType = [
  {
    name: "РеквизитБезТипа",
    title: { items: { ru: "Реквизит без типа" } },
    columns: [],
    itemType: "FormAttribute",
  },
] as const satisfies FormAttributes
