import { dcsLocalStringTypeRule } from "../dcsLocalStringType/types"
import { dcsMetadataTypedValueRule } from "../dscMetadataTypedValue/types"
import { filterItemRule } from "../filter/builders"
import { filterItemPresentationValueRule } from "./builders"
import { userSettingsIDRule } from "../../userSettingsID/types"
import { booleanRule } from "../../boolean/types"
import { stringRule } from "../../string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { MetadataItemRule } from "../../../orchestration"
export const FilterItemComparisonRules = {
  itemType: "FilterItemComparison",
  xsiType: "dcsset:FilterItemComparison",
  xmlOrder: [
    "use",
    "leftValue",
    "comparisonType",
    "rightValue",
    "presentation",
    "viewMode",
    "userSettingID",
    "userSettingPresentation",
  ],
  properties: {
    use: booleanRule({
      xml: "dcsset:use",
      yaml: "Использование",
      implicitValueYAML: true,
    }),
    leftValue: dcsMetadataTypedValueRule({
      xml: "dcsset:left",
      yaml: "ЛевоеЗначение",
    }),
    comparisonType: systemEnumerationRule({
      typeSE: "DataCompositionComparisonType",
      xml: "dcsset:comparisonType",
      yaml: "ВидСравнения",
      defaultValueXML: "Equal",
      implicitValueYAML: "Equal",
    }),
    rightValue: dcsMetadataTypedValueRule({
      xml: "dcsset:right",
      yaml: "ПравоеЗначение",
    }),
    presentation: filterItemPresentationValueRule({
      xml: "dcsset:presentation",
      yaml: "Представление",
    }),
    application: systemEnumerationRule({
      typeSE: "DataCompositionFilterApplicationType",
      xml: "dcsset:application",
      yaml: "Применение",
      implicitValueYAML: "Items",
    }),
    viewMode: systemEnumerationRule({
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:viewMode",
      yaml: "РежимОтображения",
      implicitValueYAML: "Auto",
    }),
    userSettingID: userSettingsIDRule({
      xml: "dcsset:userSettingID",
      yaml: "ИспользоватьПользовательскуюНастройку",
      implicitValueYAML: false,
    }),
    userSettingPresentation: dcsLocalStringTypeRule({
      xml: "dcsset:userSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройки",
    }),
    parent: stringRule({
      yaml: "Родитель",
      runtimeOnly: true,
    }),
  },
} as const satisfies MetadataItemRule
export const FilterItemGroupRules = {
  itemType: "FilterItemGroup",
  xsiType: "dcsset:FilterItemGroup",
  xmlOrder: [
    "groupType",
    "items",
  ],
  properties: {
    use: booleanRule({
      xml: "dcsset:use",
      yaml: "Использование",
      implicitValueYAML: true,
    }),
    groupType: systemEnumerationRule({
      typeSE: "DataCompositionFilterItemsGroupType",
      xml: "dcsset:groupType",
      yaml: "ТипГруппы",
    }),
    items: filterItemRule({
      xml: "dcsset:item",
      yaml: "Элементы",
    }),
    presentation: filterItemPresentationValueRule({
      xml: "dcsset:presentation",
      yaml: "Представление",
    }),
    application: systemEnumerationRule({
      typeSE: "DataCompositionFilterApplicationType",
      xml: "dcsset:application",
      yaml: "Применение",
      implicitValueYAML: "Items",
    }),
    viewMode: systemEnumerationRule({
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:viewMode",
      yaml: "РежимОтображения",
      implicitValueYAML: "Auto",
    }),
    userSettingID: userSettingsIDRule({
      xml: "dcsset:userSettingID",
      yaml: "ИспользоватьПользовательскуюНастройку",
    }),
    userSettingPresentation: filterItemPresentationValueRule({
      xml: "dcsset:userSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройки",
    }),
  },
} as const satisfies MetadataItemRule
