import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { MetadataItemRule } from "~/metadata/orchestration"
export const FilterItemComparisonRules = {
  itemType: "FilterItemComparison",
  properties: {
    use: booleanRule({
      xml: "dcsset:use",
      yaml: "Использование",
      implicitValueYAML: true,
      order: 1,
    }),
    leftValue: {
      type: "DcsMetadataTypedValue",
      xml: "dcsset:left",
      yaml: "ЛевоеЗначение",
      order: 2,
    },
    comparisonType: systemEnumerationRule({
      typeSE: "DataCompositionComparisonType",
      xml: "dcsset:comparisonType",
      yaml: "ВидСравнения",
      defaultValueXML: "Equal",
      implicitValueYAML: "Equal",
      order: 3,
    }),
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
    application: systemEnumerationRule({
      typeSE: "DataCompositionFilterApplicationType",
      xml: "dcsset:application",
      yaml: "Применение",
      order: 9,
      implicitValueYAML: "Items",
    }),
    viewMode: systemEnumerationRule({
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:viewMode",
      yaml: "РежимОтображения",
      implicitValueYAML: "Auto",
      order: 6,
    }),
    userSettingID: {
      type: "UserSettingsID",
      xml: "dcsset:userSettingID",
      yaml: "ИспользоватьПользовательскуюНастройку",
      implicitValueYAML: false,
      order: 7,
    },
    userSettingPresentation: {
      type: "DcsLocalStringType",
      xml: "dcsset:userSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройки",
      order: 8,
    },
    parent: stringRule({
      yaml: "Родитель",
      runtimeOnly: true,
      order: 10,
    }),
  },
} as const satisfies MetadataItemRule
export const FilterItemGroupRules = {
  itemType: "FilterItemGroup",
  properties: {
    use: booleanRule({
      xml: "dcsset:use",
      yaml: "Использование",
      implicitValueYAML: true,
      order: 7,
    }),
    groupType: systemEnumerationRule({
      typeSE: "DataCompositionFilterItemsGroupType",
      xml: "dcsset:groupType",
      yaml: "ТипГруппы",
      implicitValueYAML: "AndGroup",
      order: 1,
    }),
    items: {
      type: "FilterItem",
      xml: "dcsset:item",
      yaml: "Элементы",
      order: 6,
    },
    presentation: {
      type: "FilterItemPresentationValue",
      xml: "dcsset:presentation",
      yaml: "Представление",
      order: 2,
    },
    application: systemEnumerationRule({
      typeSE: "DataCompositionFilterApplicationType",
      xml: "dcsset:application",
      yaml: "Применение",
      implicitValueYAML: "Items",
      order: 8,
    }),
    viewMode: systemEnumerationRule({
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:viewMode",
      yaml: "РежимОтображения",
      implicitValueYAML: "Auto",
      order: 3,
    }),
    userSettingID: {
      type: "UserSettingsID",
      xml: "dcsset:userSettingID",
      yaml: "ИспользоватьПользовательскуюНастройку",
      order: 4,
    },
    userSettingPresentation: {
      type: "FilterItemPresentationValue",
      xml: "dcsset:userSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройки",
      order: 5,
    },
  },
} as const satisfies MetadataItemRule
