import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { MetadataTaskAddressingAttributeRules } from "./rules"

registerMetadataItemCollectionRule({
  propertyType: "MetadataTaskAddressingAttributes",
  itemRule: MetadataTaskAddressingAttributeRules,
  schemaName: "MetadataTaskAddressingAttribute",
  xmlElement: "AddressingAttribute",
  keyField: "name",
  collectionItemRule: true,
})
