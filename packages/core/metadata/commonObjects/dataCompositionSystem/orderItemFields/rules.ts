import { MetadataItemRule } from "~/metadata/orchestration"

export const OrderItemFieldRules = {
  itemType: "OrderItemField",
  xsiType: "dcsset:OrderItemField",
  properties: {
    use: {
      type: "boolean",
      xml: "dcsset:use",
      yaml: "Использование",
      defaultValueYAML: true,
      order: 1,
    },
    field: {
      type: "string",
      xml: "dcsset:field",
      yaml: "Поле",
      order: 2,
    },
    orderType: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionSortDirection",
      xml: "dcsset:orderType",
      yaml: "ТипУпорядочивания",
      defaultValueYAML: "Asc",
      defaultValueXML: "Asc",
      order: 3,
    },
    viewMode: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:viewMode",
      yaml: "РежимОтображения",
      defaultValueYAML: "Auto",
      order: 4,
    },
  },
} as const satisfies MetadataItemRule
