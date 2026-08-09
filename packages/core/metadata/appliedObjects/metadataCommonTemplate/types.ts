import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataCommonTemplateRules } from "./rules"

export type MetadataCommonTemplate = MetadataTypeByRule<typeof MetadataCommonTemplateRules>
export type MetadataCommonTemplateYAML = YAMLTypeByRule<typeof MetadataCommonTemplateRules>

registerMetadataItemRule({
  propertyType: "MetadataCommonTemplate",
  itemRule: MetadataCommonTemplateRules,
})
