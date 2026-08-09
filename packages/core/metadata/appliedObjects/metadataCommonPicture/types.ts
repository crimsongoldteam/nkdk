import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataCommonPictureRules } from "./rules"

export type MetadataCommonPicture = MetadataTypeByRule<typeof MetadataCommonPictureRules>
export type MetadataCommonPictureYAML = YAMLTypeByRule<typeof MetadataCommonPictureRules>

registerMetadataItemRule({
  propertyType: "MetadataCommonPicture",
  itemRule: MetadataCommonPictureRules,
})
