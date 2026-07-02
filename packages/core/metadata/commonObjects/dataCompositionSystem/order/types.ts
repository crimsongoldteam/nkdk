import { MetadataTypeByRule } from "../../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import "../orderItemFields/types"
import { OrderRules } from "./rules"
import { registerMetadataItemRule } from "../../../orchestration"

export type Order = MetadataTypeByRule<typeof OrderRules>
export type OrderYAML = YAMLTypeByRule<typeof OrderRules>

registerMetadataItemRule({
  propertyType: "Order",
  itemRule: OrderRules,
})
