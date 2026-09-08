import type { FormAttributes } from "../types"

export const chartSettings = [
  {
    itemType: "FormAttribute",
    name: "Диаграмма",
    type: { type: ["Chart"] },
    title: { items: { ru: "" } },
    columns: [],
    chart: '<d4p1:seriesCurId>1</d4p1:seriesCurId>\n<d4p1:pointsCurId>0</d4p1:pointsCurId>\n<d4p1:realExSeriesData>\n\t<d4p1:id>1</d4p1:id>\n\t<d4p1:color>auto</d4p1:color>\n\t<d4p1:line width="2" gap="false">\n\t\t<v8ui:style xsi:type="v8ui:ChartLineType">Solid</v8ui:style>\n\t</d4p1:line>\n\t<d4p1:text/>\n</d4p1:realExSeriesData>\n<d4p1:valuesAxis/>\n<d4p1:pointsAxis/>',
  },
] satisfies FormAttributes
