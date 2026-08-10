import type { FormAttributes } from "../types"

export const chartSettings = [
  {
    itemType: "FormAttribute",
    name: "Диаграмма",
    type: { type: ["Chart"] },
    title: { items: { ru: "" } },
    columns: [],
    chart: {
      "d4p1:seriesCurId": "1",
      "d4p1:pointsCurId": "0",
      "d4p1:realExSeriesData": {
        "d4p1:id": "1",
        "d4p1:color": "auto",
        "d4p1:line": {
          _width: "2",
          _gap: "false",
          "v8ui:style": {
            "_xsi:type": "v8ui:ChartLineType",
            "#text": "Solid",
          },
        },
        "d4p1:text": undefined,
      },
      "d4p1:valuesAxis": undefined,
      "d4p1:pointsAxis": undefined,
    },
  },
] satisfies FormAttributes
