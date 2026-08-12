import { conditionalAppearanceItemsRule } from "./builders"
import { dcsLocalStringTypeRule } from "../dcsLocalStringType/types"
import { userSettingsIDRule } from "../../userSettingsID/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { MetadataItemRule } from "../../../ruleRuntime"
import type { TypeRulesOperations } from "@nkdk/runtime/rule-kit"
const conditionalAppearanceViewModeDefaultValue = ({ operation, yaml }: { operation: TypeRulesOperations; yaml?: unknown }) => {
  if (operation === "importFromXML" || operation === "importFromXMLToYAML") return undefined
  if (operation === "importFromYAML") {
    return typeof yaml === "object" && yaml !== null && "Элементы" in yaml ? "QuickAccess" : "Normal"
  }
  return "QuickAccess"
}
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
      implicitValueYAML: "Normal",
      omitNonImplicitReferenceXMLWhenYAMLMissing: true,
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
