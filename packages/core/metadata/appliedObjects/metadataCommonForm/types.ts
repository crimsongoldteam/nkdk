import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataCommonFormRules } from "./rules"

export type MetadataCommonForm = MetadataTypeByRule<typeof MetadataCommonFormRules>
export type MetadataCommonFormYAML = YAMLTypeByRule<typeof MetadataCommonFormRules>

registerMetadataItemRule({
  propertyType: "MetadataCommonForm",
  itemRule: MetadataCommonFormRules,
})
