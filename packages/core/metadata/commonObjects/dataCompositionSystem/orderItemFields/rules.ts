import { MetadataItemRule } from "~/metadata/orchestration"

export const OrderItemFieldRules = {
  itemType: "OrderItemField",
  xsiType: "dcsset:OrderItemField",
  properties: {
    field: {
      type: "string",
      xml: "dcsset:field",
      yaml: "Поле",
    },
    orderType: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionSortDirection",
      xml: "dcsset:orderType",
      yaml: "ТипУпорядочивания",
      defaultValueYAML: "Asc",
    },
    use: {
      type: "boolean",
      xml: "dcsset:use",
      yaml: "Использование",
      defaultValueYAML: true,
    },
    viewMode: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:viewMode",
      yaml: "РежимОтображения",
      defaultValueYAML: "Auto",
    },
  },
} as const satisfies MetadataItemRule
