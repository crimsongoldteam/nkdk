import { registerMetadataItemRule, registerTypeRule } from "../../../ruleRuntime"
import { MetadataTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { ConditionalAppearanceRules } from "./rules"

export type ConditionalAppearance = MetadataTypeByRule<typeof ConditionalAppearanceRules>
export type ConditionalAppearanceYAML = YAMLTypeByRule<typeof ConditionalAppearanceRules>

registerMetadataItemRule({
  propertyType: "ConditionalAppearance",
  itemRule: ConditionalAppearanceRules,
})
registerTypeRule("ConditionalAppearance", "xmlImportPropertyBehavior", { presenceAffectsExport: true })
