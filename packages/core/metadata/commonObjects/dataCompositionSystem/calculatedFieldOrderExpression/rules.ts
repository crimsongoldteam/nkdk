import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { MetadataItemRule } from "~/metadata/orchestration"
export const CalculatedFieldOrderExpressionRules = {
  itemType: "CalculatedFieldOrderExpression",
  properties: {
    expression: stringRule({
      xml: "expression",
      yaml: "Выражение",
      order: 1,
      xmlNamespace: "http://v8.1c.ru/8.1/data-composition-system/common",
    }),
    orderType: systemEnumerationRule({
      typeSE: "DataCompositionSortDirection",
      xml: "orderType",
      yaml: "ТипУпорядочивания",
      order: 2,
      xmlNamespace: "http://v8.1c.ru/8.1/data-composition-system/common",
      implicitValueYAML: "Asc",
    }),
    autoOrder: booleanRule({
      xml: "autoOrder",
      yaml: "Автоупорядочивание",
      order: 3,
      xmlNamespace: "http://v8.1c.ru/8.1/data-composition-system/common",
      implicitValueYAML: false,
    }),
  },
} as const satisfies MetadataItemRule
