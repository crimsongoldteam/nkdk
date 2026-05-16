import type { FormAttributes } from "../types"

export const ganttChartSettings = [
  {
    itemType: "FormAttribute",
    name: "ДиаграммаГанта",
    type: { type: ["GanttChart"] },
    title: { items: { ru: "" } },
    columns: [],
    ganttChart: { "d4p1:chart": undefined },
  },
] satisfies FormAttributes
