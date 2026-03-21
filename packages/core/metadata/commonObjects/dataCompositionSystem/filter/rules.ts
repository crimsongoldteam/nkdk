import { MetadataItemRule } from "~/metadata/orchestration"

export const FilterRules = {
  itemType: "Filter",
  properties: {
    availableFields: {
      type: "AvailableFields",
      xml: "dcsset:availableFields",
      yaml: "ДоступныеПоляОтбора",
    },
    items: {
      type: "FilterItem",
      xml: "dcsset:item",
      yaml: "Элементы",
    },
    viewMode: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:viewMode",
      yaml: "РежимОтображения",
      defaultValueYAML: "Auto",
    },
    userSettingID: {
      type: "string",
      xml: "dcsset:userSettingID",
      yaml: "ИдентификаторПользовательскойНастройки",
    },
    userSettingPresentation: {
      type: "string",
      xml: "dcsset:userSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройки",
    },
  },
} as const satisfies MetadataItemRule
