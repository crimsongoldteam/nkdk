import { booleanRule } from "../../boolean/types"
import { stringRule } from "../../string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { MetadataItemRule } from "../../../orchestration"
export const OrderItemFieldRules = {
  itemType: "OrderItemField",
  xsiType: "dcsset:OrderItemField",
  xmlOrder: [
    "field",
    "orderType",
  ],
  properties: {
    use: booleanRule({
      xml: "dcsset:use",
      yaml: "Использование",
      implicitValueYAML: true,
    }),
    field: stringRule({
      xml: "dcsset:field",
      yaml: "Поле",
    }),
    orderType: systemEnumerationRule({
      typeSE: "DataCompositionSortDirection",
      xml: "dcsset:orderType",
      yaml: "ТипУпорядочивания",
      implicitValueYAML: "Asc",
      defaultValueXML: "Asc",
    }),
    viewMode: systemEnumerationRule({
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:viewMode",
      yaml: "РежимОтображения",
      implicitValueYAML: "Auto",
    }),
  },
} as const satisfies MetadataItemRule
