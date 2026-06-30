import { conditionalAppearanceItemsRule } from "~/metadata/commonObjects/dataCompositionSystem/conditionalAppearance/types"
import { dcsLocalStringTypeRule } from "~/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/types"
import { userSettingsIDRule } from "~/metadata/commonObjects/userSettingsID/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { MetadataItemRule } from "~/metadata/orchestration"
import type { TypeRulesOperations } from "~/metadata/orchestration/property/fn"
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
