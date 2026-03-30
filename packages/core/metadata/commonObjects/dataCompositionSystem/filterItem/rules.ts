import { MetadataItemRule } from "~/metadata/orchestration"

export const FilterItemComparisonRules = {
  itemType: "FilterItemComparison",
  properties: {
    use: {
      type: "boolean",
      xml: "dcsset:use",
      yaml: "Использование",
      defaultValueYAML: true,
      order: 6,
    },
    leftValue: {
      type: "DcsMetadataTypedValue",
      xml: "dcsset:left",
      yaml: "ЛевоеЗначение",
      order: 3,
    },
    comparisonType: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionComparisonType",
      xml: "dcsset:comparisonType",
      yaml: "ВидСравнения",
      defaultValueYAML: "Equal",
      order: 2,
    },
    rightValue: {
      type: "DcsMetadataTypedValue",
      xml: "dcsset:right",
      yaml: "ПравоеЗначение",
      order: 5,
    },
    presentation: {
      type: "FilterItemPresentationValue",
      xml: "dcsset:presentation",
      yaml: "Представление",
      order: 4,
    },
    application: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionFilterApplicationType",
      xml: "dcsset:application",
      yaml: "Применение",
      order: 1,
      //   defaultValueYAML: "Items",
    },
    viewMode: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:viewMode",
      yaml: "РежимОтображения",
      defaultValueYAML: "Auto",
      order: 8,
    },
    userSettingID: {
      type: "UserSettingsID",
      xml: "dcsset:userSettingID",
      yaml: "ИспользоватьПользовательскуюНастройку",
      defaultValueYAML: false,
      order: 9,
    },
    userSettingPresentation: {
      type: "string",
      xml: "dcsset:userSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройки",
      order: 7,
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
      order: 5,
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
      order: 1,
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
      order: 8,
    },
    userSettingPresentation: {
      type: "string",
      xml: "dcsset:userSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройки",
      order: 6,
    },
  },
} as const satisfies MetadataItemRule
