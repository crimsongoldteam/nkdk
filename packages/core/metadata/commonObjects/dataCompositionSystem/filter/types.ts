import { MetadataTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import "../filterItem/types"
import { FilterRules } from "./rules"
import { registerMetadataItemRule, registerTypeRule } from "../../../ruleRuntime"

export type Filter = MetadataTypeByRule<typeof FilterRules>

export type FilterYAML = YAMLTypeByRule<typeof FilterRules>

registerMetadataItemRule({
  propertyType: "Filter",
  itemRule: FilterRules,
})
registerTypeRule("Filter", "xmlImportPropertyBehavior", { presenceAffectsExport: true })
