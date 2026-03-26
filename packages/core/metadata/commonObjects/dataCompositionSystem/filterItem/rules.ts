import { MetadataItemRule } from "~/metadata/orchestration"

export const FilterItemComparisonRules = {
  itemType: "FilterItemComparison",
  properties: {
    use: {
      type: "boolean",
      xml: "dcsset:use",
      yaml: "Использование",
      defaultValueYAML: true,
    },
    leftValue: {
      type: "FilterItemFieldValue",
      xml: "dcsset:left",
      yaml: "ЛевоеЗначение",
    },
    comparisonType: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionComparisonType",
      xml: "dcsset:comparisonType",
      yaml: "ВидСравнения",
      defaultValueYAML: "Equal",
    },
    rightValue: {
      type: "FilterItemPrimitiveValue",
      xml: "dcsset:right",
      yaml: "ПравоеЗначение",
    },
    presentation: {
      type: "FilterItemPresentationValue",
      xml: "dcsset:presentation",
      yaml: "Представление",
    },
    application: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionFilterApplicationType",
      xml: "dcsset:application",
      yaml: "Применение",
      //   defaultValueYAML: "Items",
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
      defaultValueYAML: false,
    },
    userSettingPresentation: {
      type: "string",
      xml: "dcsset:userSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройки",
    },
    parent: {
      type: "string",
      yaml: "Родитель",
      runtimeOnly: true,
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
    },
    groupType: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionFilterItemsGroupType",
      xml: "dcsset:groupType",
      yaml: "ТипГруппы",
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
  },
} as const satisfies MetadataItemRule
