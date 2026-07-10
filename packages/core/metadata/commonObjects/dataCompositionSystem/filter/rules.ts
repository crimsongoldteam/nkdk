import { availableFieldsRule } from "../availableFields/types"
import { dcsLocalStringTypeRule } from "../dcsLocalStringType/types"
import { filterItemRule } from "./builders"
import { userSettingsIDRule } from "../../userSettingsID/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { MetadataItemRule } from "../../../orchestration"
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
