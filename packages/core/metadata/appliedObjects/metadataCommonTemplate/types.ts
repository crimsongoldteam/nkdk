import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataCommonTemplateRules } from "./rules"

export type MetadataCommonTemplate = MetadataTypeByRule<typeof MetadataCommonTemplateRules>
export type MetadataCommonTemplateYAML = YAMLTypeByRule<typeof MetadataCommonTemplateRules>

registerMetadataItemRule({
  propertyType: "MetadataCommonTemplate",
  itemRule: MetadataCommonTemplateRules,
})
