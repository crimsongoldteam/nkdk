import { booleanRule } from "../../boolean/types"
import { stringRule } from "../../string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { MetadataItemRule } from "../../../orchestration"
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
      omitNonImplicitReferenceXMLWhenYAMLMissing: true,
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
