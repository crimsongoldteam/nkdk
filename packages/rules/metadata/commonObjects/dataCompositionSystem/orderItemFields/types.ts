import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { type MetadataItemRule } from "../../../ruleRuntime"
import { defineMetadataItemCollectionRule } from "../../../ruleRuntime/metadataCollection/ruleFactory"
import { composeMetadataRules, defineMetadataRules } from "../../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../../ruleRuntime/definition/testSupport"
import { MetadataTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { schemaRef } from "../../../ruleRuntime/jsonSchemaRefs"
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

const collectionRules = defineMetadataItemCollectionRule({
  propertyType: "OrderItemFields",
  itemRule: OrderItemFieldRules,
  // xmlElement: "dcsset:item",
  fromXMLToYAML: importOrderItemFieldsFromXMLToYAML,
  toJSONSchema: exportOrderItemFieldsToJSONSchema,
  yamlAsArray: true,
  configurationIndexAddressing: "yamlPath",
})

export const metadataPropertyRule000 = definePropertyTypeRule("OrderItemFields", "yamlToXMLNestedRule", {
  kind: "collection",
  itemRule: OrderItemFieldRules,
  resolveItemRule: ({ yaml }) => (yaml === "[Авто]" ? OrderItemAutoRules : OrderItemFieldRules),
  normalizeItemYAML: ({ yaml }) => (yaml === "[Авто]" ? {} : yaml),
  yamlShape: "array",
  configurationIndexAddressing: "yamlPath",
})

const schemaRules = defineMetadataRules({
  ...emptyMetadataRules,
  schemaPropertyRefs: {
    OrderItemFields: () =>
      Type.Array(
        Type.Union([Type.Literal("[Авто]"), schemaRef("OrderItemField")]),
      ),
  },
})

export const metadataRuleLayer000 = composeMetadataRules(
  collectionRules,
  schemaRules,
)
