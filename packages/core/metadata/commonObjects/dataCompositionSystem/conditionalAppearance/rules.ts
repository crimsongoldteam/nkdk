import { conditionalAppearanceItemsRule } from "./builders"
import { dcsLocalStringTypeRule } from "../dcsLocalStringType/types"
import { userSettingsIDRule } from "../../userSettingsID/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { MetadataItemRule } from "../../../orchestration"
import type { TypeRulesOperations } from "../../../orchestration/property/fn"
const conditionalAppearanceViewModeDefaultValue = ({ operation }: { operation: TypeRulesOperations }) =>
  operation === "importFromYAML" ? undefined : "QuickAccess"
export const ConditionalAppearanceRules = {
  itemType: "ConditionalAppearance",
  properties: {
    conditionalAppearanceItems: conditionalAppearanceItemsRule({
      xml: "dcsset:item",
      yaml: "Элементы",
    }),
    viewMode: systemEnumerationRule({
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:viewMode",
      yaml: "РежимОтображения",
      implicitValueYAML: "Normal",
      defaultValueXML: "QuickAccess",
      defaultValue: conditionalAppearanceViewModeDefaultValue,
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
