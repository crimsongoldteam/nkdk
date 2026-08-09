import { MetadataTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import "../orderItemFields/types"
import { OrderRules } from "./rules"
import { registerMetadataItemRule } from "../../../ruleRuntime"

export type Order = MetadataTypeByRule<typeof OrderRules>
export type OrderYAML = YAMLTypeByRule<typeof OrderRules>

registerMetadataItemRule({
  propertyType: "Order",
  itemRule: OrderRules,
})
