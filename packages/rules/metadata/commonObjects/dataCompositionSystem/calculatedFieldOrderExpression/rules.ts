import { booleanRule } from "../../boolean/types"
import { stringRule } from "../../string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { MetadataItemRule } from "../../../ruleRuntime"
export const CalculatedFieldOrderExpressionRules = {
  itemType: "CalculatedFieldOrderExpression",
  xmlOrder: ["expression", "orderType", "autoOrder"],
  properties: {
    expression: stringRule({
      xml: "expression",
      yaml: "Выражение",
      xmlNamespace: "http://v8.1c.ru/8.1/data-composition-system/common",
      preserveUnknownReferenceXML: false,
    }),
    orderType: systemEnumerationRule({
      typeSE: "DataCompositionSortDirection",
      xml: "orderType",
      yaml: "ТипУпорядочивания",
      xmlNamespace: "http://v8.1c.ru/8.1/data-composition-system/common",
      noImplicitValueYAML: true,
      preserveUnknownReferenceXML: false,
    }),
    autoOrder: booleanRule({
      xml: "autoOrder",
      yaml: "Автоупорядочивание",
      xmlNamespace: "http://v8.1c.ru/8.1/data-composition-system/common",
      noImplicitValueYAML: true,
    }),
  },
} as const satisfies MetadataItemRule
