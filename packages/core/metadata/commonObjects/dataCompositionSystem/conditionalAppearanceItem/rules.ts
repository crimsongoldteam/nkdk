import { appearanceFieldsRule } from "../appearanceFields/builders"
import { availableFieldsRule } from "../availableFields/types"
import { filterRule } from "./builders"
import { dcsLocalStringTypeRule } from "../dcsLocalStringType/types"
import { booleanRule } from "../../boolean/types"
import { stringRule } from "../../string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { MetadataItemRule } from "../../../orchestration"
export const ConditionalAppearanceItemRules = {
  itemType: "ConditionalAppearanceItem",
  properties: {
    use: booleanRule({
      xml: "dcsset:use",
      yaml: "Использование",
      implicitValueYAML: true,
      order: 0,
    }),
    fields: availableFieldsRule({
      xml: "dcsset:selection",
      yaml: "Поля",
      order: 1,
      defaultValueXMLRaw: {},
    }),
    filter: filterRule({
      xml: "dcsset:filter",
      yaml: "Отбор",
      order: 2,
      defaultValueXMLRaw: {},
    }),
    appearance: appearanceFieldsRule({
      xml: "dcsset:appearance",
      yaml: "Оформление",
      defaultValueXMLRaw: {},
      order: 3,
    }),
    presentation: dcsLocalStringTypeRule({
      xml: "dcsset:presentation",
      yaml: "Представление",
    }),
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
    userSettingPresentation: dcsLocalStringTypeRule({
      xml: "dcsset:userSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройки",
    }),
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
