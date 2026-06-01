import type { FormAttributes } from "../types"

export const plannerSettingsWithNil = [
  {
    itemType: "FormAttribute",
    name: "Канбан",
    type: { type: ["Planner"] },
    title: { items: { ru: "" } },
    columns: [],
    planner: {
      "pl:item": {
        "pl:value": { "_xsi:nil": true },
        "pl:text": "Встреча",
      },
    },
  },
] satisfies FormAttributes
