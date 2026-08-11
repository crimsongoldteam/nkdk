import { defineMetadataItemRule, definePropertyTypeRule } from "../../../ruleRuntime"
import { MetadataTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { ConditionalAppearanceRules } from "./rules"

export type ConditionalAppearance = MetadataTypeByRule<typeof ConditionalAppearanceRules>
export type ConditionalAppearanceYAML = YAMLTypeByRule<typeof ConditionalAppearanceRules>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "ConditionalAppearance",
  itemRule: ConditionalAppearanceRules,
})
export const metadataPropertyRule001 = definePropertyTypeRule("ConditionalAppearance", "xmlImportPropertyBehavior", { presenceAffectsExport: true })
