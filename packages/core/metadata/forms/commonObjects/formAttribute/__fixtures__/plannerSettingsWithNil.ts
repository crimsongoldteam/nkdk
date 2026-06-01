import type { FormAttributes } from "../types"

export const plannerSettingsWithNil = [
  {
    itemType: "FormAttribute",
    name: "Планировщик",
    type: { type: ["Planner"] },
    title: { items: { ru: "" } },
    columns: [],
    planner: {
      "pl:value": { "_xsi:nil": true },
    },
  },
] satisfies FormAttributes
