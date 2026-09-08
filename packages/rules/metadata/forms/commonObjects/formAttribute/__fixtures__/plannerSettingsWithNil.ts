import type { FormAttributes } from "../types"

export const plannerSettingsWithNil = [
  {
    itemType: "FormAttribute",
    name: "Канбан",
    type: { type: ["Planner"] },
    title: { items: { ru: "" } },
    columns: [],
    planner: '<pl:item>\n\t<pl:value xsi:nil="true"/>\n\t<pl:text>Встреча</pl:text>\n</pl:item>',
  },
] satisfies FormAttributes
