import { MetadataItemRule } from "~/metadata/orchestration"

export const OrderRules = {
  itemType: "Order",
  properties: {
    items: {
      type: "OrderItemFields",
      xml: "dcsset:item",
      yaml: "Элементы",
    },
    viewMode: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:viewMode",
      yaml: "РежимОтображения",
      implicitValueYAML: "Auto",
    },
    userSettingID: {
      type: "UserSettingsID",
      xml: "dcsset:userSettingID",
      yaml: "ИспользоватьПользовательскуюНастройку",
    },
    userSettingPresentation: {
      type: "DcsLocalStringType",
      xml: "dcsset:userSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройки",
    },
  },
} as const satisfies MetadataItemRule
