import { MetadataItemRule } from "~/metadata/orchestration"

export const CalculatedFieldOrderExpressionRules = {
  itemType: "CalculatedFieldOrderExpression",
  properties: {
    expression: {
      type: "string",
      xml: "expression",
      yaml: "Выражение",
      order: 1,
    },
    orderType: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionSortDirection",
      xml: "orderType",
      yaml: "ТипУпорядочивания",
      order: 2,
    },
    autoOrder: {
      type: "boolean",
      xml: "autoOrder",
      yaml: "Автоупорядочивание",
      order: 3,
    },
  },
} as const satisfies MetadataItemRule
