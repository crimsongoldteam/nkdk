import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataReportRules } from "./rules"

export type MetadataReport = MetadataTypeByRule<typeof MetadataReportRules>
export type MetadataReportYAML = YAMLTypeByRule<typeof MetadataReportRules>

registerMetadataItemRule({
  propertyType: "MetadataReport",
  itemRule: MetadataReportRules,
})
