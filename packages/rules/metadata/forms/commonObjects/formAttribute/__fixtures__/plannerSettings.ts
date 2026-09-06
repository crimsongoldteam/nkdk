import type { FormAttributes } from "../types"

export const plannerSettings = [
  {
    itemType: "FormAttribute",
    name: "Канбан",
    type: { type: ["Planner"] },
    title: { items: { ru: "" } },
    columns: [],
    planner: "<pl:itemsCurId>1</pl:itemsCurId>\n<pl:periodsCurId>2</pl:periodsCurId>\n<pl:resourcesCurId>3</pl:resourcesCurId>",
  },
] satisfies FormAttributes
