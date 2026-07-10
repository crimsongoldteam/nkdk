import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataExchangePlanRules } from "./rules"

export type MetadataExchangePlan = MetadataTypeByRule<typeof MetadataExchangePlanRules>
export type MetadataExchangePlanYAML = YAMLTypeByRule<typeof MetadataExchangePlanRules>

registerMetadataItemRule({
  propertyType: "MetadataExchangePlan",
  itemRule: MetadataExchangePlanRules,
})
