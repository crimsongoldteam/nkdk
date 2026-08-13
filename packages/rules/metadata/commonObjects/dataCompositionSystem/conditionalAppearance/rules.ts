import { conditionalAppearanceItemsRule } from "./builders"
import { dcsLocalStringTypeRule } from "../dcsLocalStringType/types"
import { userSettingsIDRule } from "../../userSettingsID/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { MetadataItemRule } from "../../../ruleRuntime"
export const ConditionalAppearanceRules = {
  itemType: "ConditionalAppearance",
  xmlOrder: ["conditionalAppearanceItems", "viewMode", "userSettingID", "userSettingPresentation"],
  properties: {
    conditionalAppearanceItems: conditionalAppearanceItemsRule({
      xml: "dcsset:item",
      yaml: "Элементы",
    }),
    viewMode: systemEnumerationRule({
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:viewMode",
      yaml: "РежимОтображения",
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
  },
} as const satisfies MetadataItemRule
