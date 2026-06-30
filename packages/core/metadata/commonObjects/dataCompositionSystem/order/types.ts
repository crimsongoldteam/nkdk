import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import "../orderItemFields/types"
import { OrderRules } from "./rules"
import { registerMetadataItemRule } from "~/metadata/orchestration"

export type Order = MetadataTypeByRule<typeof OrderRules>
export type OrderYAML = YAMLTypeByRule<typeof OrderRules>

registerMetadataItemRule({
  propertyType: "Order",
  itemRule: OrderRules,
})
