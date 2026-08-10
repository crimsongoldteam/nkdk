import { defineMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import { MetadataTaskAddressingAttributeRules } from "./rules"

export const metadataRuleLayer000 = defineMetadataItemCollectionRule({
  propertyType: "MetadataTaskAddressingAttributes",
  itemRule: MetadataTaskAddressingAttributeRules,
  schemaName: "MetadataTaskAddressingAttribute",
  xmlElement: "AddressingAttribute",
  keyField: "name",
  collectionItemRule: true,
})
