import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { MetadataTaskAddressingAttributeRules } from "./rules"

registerMetadataItemCollectionRule({
  propertyType: "MetadataTaskAddressingAttributes",
  itemRule: MetadataTaskAddressingAttributeRules,
  xmlElement: "AddressingAttribute",
  keyField: "name",
  collectionItemRule: true,
})
