import { MetadataItemRule } from "~/metadata/orchestration"

export const FilterItemGroupRules = {
  itemType: "FilterItemGroup",
  properties: {
    use: {
      type: "boolean",
      xml: "dcsset:use",
      yaml: "Использование",
    },
    groupType: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionFilterItemsGroupType",
      xml: "dcsset:groupType",
      yaml: "ТипГруппы",
      defaultValueYAML: "AndGroup",
    },
    items: {
      type: "FilterItem",
      xml: "dcsset:item",
      yaml: "Элементы",
    },
    presentation: {
      type: "string",
      xml: "dcsset:presentation",
      yaml: "Представление",
    },
    application: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionFilterApplicationType",
      xml: "dcsset:application",
      yaml: "Применение",
      //   defaultValueYAML: "",
    },
    viewMode: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:viewMode",
      yaml: "РежимОтображения",
      defaultValueYAML: "Auto",
    },
    userSettingID: {
      type: "UserSettingsID",
      xml: "dcsset:userSettingID",
      yaml: "ИспользоватьПользовательскуюНастройку",
    },
    userSettingPresentation: {
      type: "string",
      xml: "dcsset:userSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройки",
    },
    // parent: {
    //   type: "string",
    //   yaml: "Родитель",
    //   runtimeOnly: true,
    // },
  },
} as const satisfies MetadataItemRule
