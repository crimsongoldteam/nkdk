import { MetadataItemRule } from "~/metadata/orchestration"

export const FilterItemComparisonRules = {
  itemType: "FilterItemComparison",
  properties: {
    use: {
      type: "boolean",
      xml: "dcsset:use",
      yaml: "Использование",
      defaultValueYAML: true,
      order: 1,
    },
    leftValue: {
      type: "DcsMetadataTypedValue",
      xml: "dcsset:left",
      yaml: "ЛевоеЗначение",
      order: 2,
    },
    comparisonType: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionComparisonType",
      xml: "dcsset:comparisonType",
      yaml: "ВидСравнения",
      defaultValueYAML: "Equal",
      order: 3,
    },
    rightValue: {
      type: "DcsMetadataTypedValue",
      xml: "dcsset:right",
      yaml: "ПравоеЗначение",
      order: 4,
    },
    presentation: {
      type: "FilterItemPresentationValue",
      xml: "dcsset:presentation",
      yaml: "Представление",
      order: 5,
    },
    application: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionFilterApplicationType",
      xml: "dcsset:application",
      yaml: "Применение",
      order: 6,
      //   defaultValueYAML: "Items",
    },
    viewMode: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:viewMode",
      yaml: "РежимОтображения",
      defaultValueYAML: "Auto",
      order: 7,
    },
    userSettingID: {
      type: "UserSettingsID",
      xml: "dcsset:userSettingID",
      yaml: "ИспользоватьПользовательскуюНастройку",
      defaultValueYAML: false,
      order: 8,
    },
    userSettingPresentation: {
      type: "string",
      xml: "dcsset:userSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройки",
      order: 9,
    },
    parent: {
      type: "string",
      yaml: "Родитель",
      runtimeOnly: true,
      order: 10,
    },
  },
} as const satisfies MetadataItemRule

export const FilterItemGroupRules = {
  itemType: "FilterItemGroup",
  properties: {
    use: {
      type: "boolean",
      xml: "dcsset:use",
      yaml: "Использование",
      order: 1,
    },
    groupType: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionFilterItemsGroupType",
      xml: "dcsset:groupType",
      yaml: "ТипГруппы",
      order: 2,
    },
    items: {
      type: "FilterItem",
      xml: "dcsset:item",
      yaml: "Элементы",
      order: 3,
    },
    presentation: {
      type: "string",
      xml: "dcsset:presentation",
      yaml: "Представление",
      order: 4,
    },
    application: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionFilterApplicationType",
      xml: "dcsset:application",
      yaml: "Применение",
      order: 5,
    },
    viewMode: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:viewMode",
      yaml: "РежимОтображения",
      defaultValueYAML: "Auto",
      order: 6,
    },
    userSettingID: {
      type: "UserSettingsID",
      xml: "dcsset:userSettingID",
      yaml: "ИспользоватьПользовательскуюНастройку",
      order: 7,
    },
    userSettingPresentation: {
      type: "string",
      xml: "dcsset:userSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройки",
      order: 8,
    },
  },
} as const satisfies MetadataItemRule
