import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { MetadataRegisterAttributeRules } from "./rules"

registerMetadataItemCollectionRule({
  propertyType: "MetadataRegisterAttributes",
  itemRule: MetadataRegisterAttributeRules,
  xmlElement: "Attribute",
  keyField: "name",
  collectionItemRule: true,
})
