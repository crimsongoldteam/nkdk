import { registerMetadataItemCollectionRule } from "../../../orchestration"
import { MetadataTypeByRule } from "../../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { registerJSONSchemaPropertyRef, schemaRef } from "../../../orchestration/jsonSchemaRefs"
import { Type } from "typebox"
import { importOrderItemFieldsFromXML } from "./fromXML"
import { importOrderItemFieldsFromXMLToYAML } from "./fromXMLToYAML"
import { importOrderItemFieldsFromYAML } from "./fromYAML"
import { OrderItemFieldRules } from "./rules"
import { exportOrderItemFieldsToJSONSchema } from "./toJSONSchema"
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
  fromXMLToYAML: importOrderItemFieldsFromXMLToYAML,
  fromYAML: importOrderItemFieldsFromYAML,
  toXML: exportOrderItemFieldsToXML,
  toYAML: exportOrderItemFieldsToYAML,
  toJSONSchema: exportOrderItemFieldsToJSONSchema,
  yamlAsArray: true,
  configurationIndexAddressing: "yamlPath",
})

registerJSONSchemaPropertyRef("OrderItemFields", () => Type.Array(Type.Union([Type.Literal("[Авто]"), schemaRef("OrderItemField")])))
