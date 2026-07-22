import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { MetadataCommandRules } from "./rules"

registerMetadataItemCollectionRule({
  propertyType: "MetadataCommands",
  itemRule: MetadataCommandRules,
  xmlElement: "Command",
  keyField: "name",
})
