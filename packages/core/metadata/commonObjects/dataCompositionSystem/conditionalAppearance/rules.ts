import { conditionalAppearanceItemsRule } from "./builders"
import { dcsLocalStringTypeRule } from "../dcsLocalStringType/types"
import { userSettingsIDRule } from "../../userSettingsID/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { MetadataItemRule } from "../../../ruleRuntime"
import type { TypeRulesOperations } from "../../../ruleRuntime/property/fn"
const conditionalAppearanceViewModeDefaultValue = ({ operation }: { operation: TypeRulesOperations }) =>
  operation === "importFromXML" || operation === "importFromXMLToYAML" || operation === "importFromYAML"
    ? undefined
    : "QuickAccess"
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
