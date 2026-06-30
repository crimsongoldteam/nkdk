import { availableFieldsRule } from "~/metadata/commonObjects/dataCompositionSystem/availableFields/types"
import { dcsLocalStringTypeRule } from "~/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/types"
import { filterItemRule } from "~/metadata/commonObjects/dataCompositionSystem/filter/builders"
import { userSettingsIDRule } from "~/metadata/commonObjects/userSettingsID/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { MetadataItemRule } from "~/metadata/orchestration"
export const FilterRules = {
  itemType: "Filter",
  properties: {
    availableFields: availableFieldsRule({
      xml: "dcsset:availableFields",
      yaml: "ДоступныеПоляОтбора",
    }),
    items: filterItemRule({
      xml: "dcsset:item",
      yaml: "Элементы",
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
    userSettingPresentation: dcsLocalStringTypeRule({
      xml: "dcsset:userSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройки",
    }),
  },
} as const satisfies MetadataItemRule
