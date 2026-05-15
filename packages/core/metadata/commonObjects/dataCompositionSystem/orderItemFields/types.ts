import { registerMetadataItemCollectionRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { importOrderItemFieldsFromXML } from "./fromXML"
import { importOrderItemFieldsFromYAML } from "./fromYAML"
import { OrderItemFieldRules } from "./rules"
import { exportOrderItemFieldsToXML } from "./toXML"
import { exportOrderItemFieldsToYAML } from "./toYAML"

export type OrderItemField = MetadataTypeByRule<typeof OrderItemFieldRules>
export type OrderItemAuto = { itemType: "OrderItemAuto" }
export type OrderItem = OrderItemField | OrderItemAuto
export type OrderItemFieldYAML = YAMLTypeByRule<typeof OrderItemFieldRules>
export type OrderItemAutoYAML = "[Авто]"
export type OrderItemYAML = OrderItemFieldYAML | OrderItemAutoYAML
export type OrderItemFields = OrderItem[]
export type OrderItemFieldsYAML = OrderItemYAML[]

registerMetadataItemCollectionRule({
  propertyType: "OrderItemFields",
  itemRule: OrderItemFieldRules,
  // xmlElement: "dcsset:item",
  fromXML: importOrderItemFieldsFromXML,
  fromYAML: importOrderItemFieldsFromYAML,
  toXML: exportOrderItemFieldsToXML,
  toYAML: exportOrderItemFieldsToYAML,
  yamlAsArray: true,
})
