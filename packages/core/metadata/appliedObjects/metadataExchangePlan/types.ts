import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataExchangePlanRules } from "./rules"

export type MetadataExchangePlan = MetadataTypeByRule<typeof MetadataExchangePlanRules>
export type MetadataExchangePlanYAML = YAMLTypeByRule<typeof MetadataExchangePlanRules>

registerMetadataItemRule({
  propertyType: "MetadataExchangePlan",
  itemRule: MetadataExchangePlanRules,
})
