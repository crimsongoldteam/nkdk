import { defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataCommonModuleRules } from "./rules"

export type MetadataCommonModule = MetadataTypeByRule<typeof MetadataCommonModuleRules>
export type MetadataCommonModuleYAML = YAMLTypeByRule<typeof MetadataCommonModuleRules>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataCommonModule",
  itemRule: MetadataCommonModuleRules,
})
