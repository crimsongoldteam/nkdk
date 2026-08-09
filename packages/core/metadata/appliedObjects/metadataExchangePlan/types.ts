import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataExchangePlanRules } from "./rules"

export type MetadataExchangePlan = MetadataTypeByRule<typeof MetadataExchangePlanRules>
export type MetadataExchangePlanYAML = YAMLTypeByRule<typeof MetadataExchangePlanRules>

registerMetadataItemRule({
  propertyType: "MetadataExchangePlan",
  itemRule: MetadataExchangePlanRules,
})
