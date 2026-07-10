import { booleanRule } from "../../boolean/types"
import { stringRule } from "../../string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { MetadataItemRule } from "../../../orchestration"
export const OrderItemFieldRules = {
  itemType: "OrderItemField",
  xsiType: "dcsset:OrderItemField",
  properties: {
    use: booleanRule({
      xml: "dcsset:use",
      yaml: "Использование",
      implicitValueYAML: true,
      order: 1,
    }),
    field: stringRule({
      xml: "dcsset:field",
      yaml: "Поле",
      order: 2,
    }),
    orderType: systemEnumerationRule({
      typeSE: "DataCompositionSortDirection",
      xml: "dcsset:orderType",
      yaml: "ТипУпорядочивания",
      implicitValueYAML: "Asc",
      defaultValueXML: "Asc",
      order: 3,
    }),
    viewMode: systemEnumerationRule({
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:viewMode",
      yaml: "РежимОтображения",
      implicitValueYAML: "Auto",
      order: 4,
    }),
  },
} as const satisfies MetadataItemRule
