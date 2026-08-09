import { registerMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import { MetadataTaskAddressingAttributeRules } from "./rules"

registerMetadataItemCollectionRule({
  propertyType: "MetadataTaskAddressingAttributes",
  itemRule: MetadataTaskAddressingAttributeRules,
  schemaName: "MetadataTaskAddressingAttribute",
  xmlElement: "AddressingAttribute",
  keyField: "name",
  collectionItemRule: true,
})
