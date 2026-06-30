import { dcsLocalStringTypeRule } from "~/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/types"
import { dcsMetadataTypedValueRule } from "~/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types"
import { filterItemRule } from "~/metadata/commonObjects/dataCompositionSystem/filter/builders"
import { filterItemPresentationValueRule } from "~/metadata/commonObjects/dataCompositionSystem/filterItem/builders"
import { userSettingsIDRule } from "~/metadata/commonObjects/userSettingsID/types"
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
    leftValue: dcsMetadataTypedValueRule({
      xml: "dcsset:left",
      yaml: "ЛевоеЗначение",
      order: 2,
    }),
    comparisonType: systemEnumerationRule({
      typeSE: "DataCompositionComparisonType",
      xml: "dcsset:comparisonType",
      yaml: "ВидСравнения",
      defaultValueXML: "Equal",
      implicitValueYAML: "Equal",
      order: 3,
    }),
    rightValue: dcsMetadataTypedValueRule({
      xml: "dcsset:right",
      yaml: "ПравоеЗначение",
      order: 4,
    }),
    presentation: filterItemPresentationValueRule({
      xml: "dcsset:presentation",
      yaml: "Представление",
      order: 5,
    }),
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
    userSettingID: userSettingsIDRule({
      xml: "dcsset:userSettingID",
      yaml: "ИспользоватьПользовательскуюНастройку",
      implicitValueYAML: false,
      order: 7,
    }),
    userSettingPresentation: dcsLocalStringTypeRule({
      xml: "dcsset:userSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройки",
      order: 8,
    }),
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
    items: filterItemRule({
      xml: "dcsset:item",
      yaml: "Элементы",
      order: 6,
    }),
    presentation: filterItemPresentationValueRule({
      xml: "dcsset:presentation",
      yaml: "Представление",
      order: 2,
    }),
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
    userSettingID: userSettingsIDRule({
      xml: "dcsset:userSettingID",
      yaml: "ИспользоватьПользовательскуюНастройку",
      order: 4,
    }),
    userSettingPresentation: filterItemPresentationValueRule({
      xml: "dcsset:userSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройки",
      order: 5,
    }),
  },
} as const satisfies MetadataItemRule
