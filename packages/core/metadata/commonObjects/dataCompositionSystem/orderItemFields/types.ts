import { registerMetadataItemCollectionRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { OrderItemFieldRules } from "./rules"

export type OrderItemField = MetadataTypeByRule<typeof OrderItemFieldRules>
export type OrderItemFieldYAML = YAMLTypeByRule<typeof OrderItemFieldRules>
export type OrderItemFields = OrderItemField[]
export type OrderItemFieldsYAML = OrderItemFieldYAML[]

registerMetadataItemCollectionRule({
  propertyType: "OrderItemFields",
  itemRule: OrderItemFieldRules,
  xmlElement: "dcsset:item",
  yamlAsArray: true,
})
