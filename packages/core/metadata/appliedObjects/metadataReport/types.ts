import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataReportRules } from "./rules"

export type MetadataReport = MetadataTypeByRule<typeof MetadataReportRules>
export type MetadataReportYAML = YAMLTypeByRule<typeof MetadataReportRules>

registerMetadataItemRule({
  propertyType: "MetadataReport",
  itemRule: MetadataReportRules,
})
