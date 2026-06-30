import { MetadataItemRule } from "~/metadata/orchestration"

export const CalculatedFieldOrderExpressionRules = {
  itemType: "CalculatedFieldOrderExpression",
  properties: {
    expression: {
      type: "string",
      xml: "expression",
      yaml: "Выражение",
      order: 1,
      xmlNamespace: "http://v8.1c.ru/8.1/data-composition-system/common",
    },
    orderType: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionSortDirection",
      xml: "orderType",
      yaml: "ТипУпорядочивания",
      order: 2,
      xmlNamespace: "http://v8.1c.ru/8.1/data-composition-system/common",
      implicitValueYAML: "Asc",
    },
    autoOrder: {
      type: "boolean",
      xml: "autoOrder",
      yaml: "Автоупорядочивание",
      order: 3,
      xmlNamespace: "http://v8.1c.ru/8.1/data-composition-system/common",
      implicitValueYAML: false,
    },
  },
} as const satisfies MetadataItemRule
