import { registerMetadataItemCollectionRule, registerTypeRule, type MetadataItemRule } from "../../../ruleRuntime"
import { MetadataTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { registerJSONSchemaPropertyRef, schemaRef } from "../../../ruleRuntime/jsonSchemaRefs"
import { Type } from "typebox"
import { importOrderItemFieldsFromXMLToYAML } from "./fromXMLToYAML"
import { OrderItemFieldRules } from "./rules"
import { exportOrderItemFieldsToJSONSchema } from "./toJSONSchema"

export type OrderItemField = MetadataTypeByRule<typeof OrderItemFieldRules>
export type OrderItemAuto = { itemType: "OrderItemAuto" }
export type OrderItem = OrderItemField | OrderItemAuto
export type OrderItemFieldYAML = YAMLTypeByRule<typeof OrderItemFieldRules>
export type OrderItemAutoYAML = "[Авто]"
export type OrderItemYAML = OrderItemFieldYAML | OrderItemAutoYAML
export type OrderItemFields = OrderItem[]
export type OrderItemFieldsYAML = OrderItemYAML[]

const OrderItemAutoRules = {
  itemType: "OrderItemAuto",
  xsiType: "dcsset:OrderItemAuto",
  properties: {},
} as const satisfies MetadataItemRule

registerMetadataItemCollectionRule({
  propertyType: "OrderItemFields",
  itemRule: OrderItemFieldRules,
  // xmlElement: "dcsset:item",
  fromXMLToYAML: importOrderItemFieldsFromXMLToYAML,
  toJSONSchema: exportOrderItemFieldsToJSONSchema,
  yamlAsArray: true,
  configurationIndexAddressing: "yamlPath",
})

registerTypeRule("OrderItemFields", "yamlToXMLNestedRule", {
  kind: "collection",
  itemRule: OrderItemFieldRules,
  resolveItemRule: ({ yaml }) => (yaml === "[Авто]" ? OrderItemAutoRules : OrderItemFieldRules),
  normalizeItemYAML: ({ yaml }) => (yaml === "[Авто]" ? {} : yaml),
  yamlShape: "array",
  configurationIndexAddressing: "yamlPath",
})

registerJSONSchemaPropertyRef("OrderItemFields", () =>
  Type.Array(Type.Union([Type.Literal("[Авто]"), schemaRef("OrderItemField")]))
)
