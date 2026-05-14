import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataCommonPictureRules } from "./rules"

export type MetadataCommonPicture = MetadataTypeByRule<typeof MetadataCommonPictureRules>
export type MetadataCommonPictureYAML = YAMLTypeByRule<typeof MetadataCommonPictureRules>

registerMetadataItemRule({
  propertyType: "MetadataCommonPicture",
  itemRule: MetadataCommonPictureRules,
})
