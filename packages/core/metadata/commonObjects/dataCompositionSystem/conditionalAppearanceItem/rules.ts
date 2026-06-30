import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { MetadataItemRule } from "~/metadata/orchestration"
export const ConditionalAppearanceItemRules = {
  itemType: "ConditionalAppearanceItem",
  properties: {
    use: booleanRule({
      xml: "dcsset:use",
      yaml: "Использование",
      implicitValueYAML: true,
      order: 0,
    }),
    fields: {
      type: "AvailableFields",
      xml: "dcsset:selection",
      yaml: "Поля",
      order: 1,
      defaultValueXMLRaw: {},
    },
    filter: {
      type: "Filter",
      xml: "dcsset:filter",
      yaml: "Отбор",
      order: 2,
      defaultValueXMLRaw: {},
    },
    appearance: {
      type: "AppearanceFields",
      xml: "dcsset:appearance",
      yaml: "Оформление",
      defaultValueXMLRaw: {},
      order: 3,
    },
    presentation: {
      type: "DcsLocalStringType",
      xml: "dcsset:presentation",
      yaml: "Представление",
    },
    viewMode: systemEnumerationRule({
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:viewMode",
      yaml: "РежимОтображения",
      implicitValueYAML: "Auto",
    }),
    userSettingID: stringRule({
      xml: "dcsset:userSettingID",
      yaml: "ИдентификаторПользовательскойНастройки",
    }),
    userSettingPresentation: {
      type: "DcsLocalStringType",
      xml: "dcsset:userSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройки",
    },
    useInGroup: systemEnumerationRule({
      typeSE: "DataCompositionConditionalAppearanceUse",
      xml: "dcsset:useInGroup",
      yaml: "ИспользоватьВГруппировке",
      implicitValueYAML: "Use",
    }),
    useInHierarchicalGroup: systemEnumerationRule({
      typeSE: "DataCompositionConditionalAppearanceUse",
      xml: "dcsset:useInHierarchicalGroup",
      yaml: "ИспользоватьВИерархическойГруппировке",
      implicitValueYAML: "Use",
    }),
    useInOverall: systemEnumerationRule({
      typeSE: "DataCompositionConditionalAppearanceUse",
      xml: "dcsset:useInOverall",
      yaml: "ИспользоватьВОбщемИтоге",
      implicitValueYAML: "Use",
    }),
    useInFieldsHeader: systemEnumerationRule({
      typeSE: "DataCompositionConditionalAppearanceUse",
      xml: "dcsset:useInFieldsHeader",
      yaml: "ИспользоватьВЗаголовкеПолей",
      implicitValueYAML: "Use",
    }),
    useInHeader: systemEnumerationRule({
      typeSE: "DataCompositionConditionalAppearanceUse",
      xml: "dcsset:useInHeader",
      yaml: "ИспользоватьВЗаголовке",
      implicitValueYAML: "Use",
    }),
    useInParameters: systemEnumerationRule({
      typeSE: "DataCompositionConditionalAppearanceUse",
      xml: "dcsset:useInParameters",
      yaml: "ИспользоватьВПараметрах",
      implicitValueYAML: "Use",
    }),
    useInFilter: systemEnumerationRule({
      typeSE: "DataCompositionConditionalAppearanceUse",
      xml: "dcsset:useInFilter",
      yaml: "ИспользоватьВОтборе",
      implicitValueYAML: "Use",
    }),
    useInResourceFieldsHeader: systemEnumerationRule({
      typeSE: "DataCompositionConditionalAppearanceUse",
      xml: "dcsset:useInResourceFieldsHeader",
      yaml: "ИспользоватьВЗаголовкеПолейРесурсов",
      implicitValueYAML: "Use",
    }),
    useInOverallHeader: systemEnumerationRule({
      typeSE: "DataCompositionConditionalAppearanceUse",
      xml: "dcsset:useInOverallHeader",
      yaml: "ИспользоватьВЗаголовкеОбщегоИтога",
      implicitValueYAML: "Use",
    }),
    useInOverallResourceFieldsHeader: systemEnumerationRule({
      typeSE: "DataCompositionConditionalAppearanceUse",
      xml: "dcsset:useInOverallResourceFieldsHeader",
      yaml: "ИспользоватьВЗаголовкеПолейРесурсовОбщегоИтога",
      implicitValueYAML: "Use",
    }),
  },
} as const satisfies MetadataItemRule
