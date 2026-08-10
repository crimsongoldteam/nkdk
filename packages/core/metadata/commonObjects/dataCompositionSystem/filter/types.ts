import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { MetadataTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import "../filterItem/types"
import { FilterRules } from "./rules"
import { defineMetadataItemRule } from "../../../ruleRuntime/metadataItem/ruleFactory"
export type Filter = MetadataTypeByRule<typeof FilterRules>

export type FilterYAML = YAMLTypeByRule<typeof FilterRules>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "Filter",
  itemRule: FilterRules,
})
export const metadataPropertyRule000 = definePropertyTypeRule("Filter", "xmlImportPropertyBehavior", { presenceAffectsExport: true })
