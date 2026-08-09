import { registerMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import { MetadataCommandRules } from "./rules"

registerMetadataItemCollectionRule({
  propertyType: "MetadataCommands",
  itemRule: MetadataCommandRules,
  xmlElement: "Command",
  keyField: "name",
})
