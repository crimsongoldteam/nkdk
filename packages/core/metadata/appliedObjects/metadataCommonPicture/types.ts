import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataCommonPictureRules } from "./rules"

export type MetadataCommonPicture = MetadataTypeByRule<typeof MetadataCommonPictureRules>
export type MetadataCommonPictureYAML = YAMLTypeByRule<typeof MetadataCommonPictureRules>

registerMetadataItemRule({
  propertyType: "MetadataCommonPicture",
  itemRule: MetadataCommonPictureRules,
})
