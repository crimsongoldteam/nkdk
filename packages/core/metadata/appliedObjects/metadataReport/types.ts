import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataReportRules } from "./rules"

export type MetadataReport = MetadataTypeByRule<typeof MetadataReportRules>
export type MetadataReportYAML = YAMLTypeByRule<typeof MetadataReportRules>

registerMetadataItemRule({
  propertyType: "MetadataReport",
  itemRule: MetadataReportRules,
})
