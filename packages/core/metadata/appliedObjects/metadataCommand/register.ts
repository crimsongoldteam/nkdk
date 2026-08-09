import { registerMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import { MetadataCommandRules } from "../../commonObjects/metadataCommand/rules"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import { registerProjectJSONSchema } from "../../projectDefinition/schemaRegistry"

registerMetadataItemCollectionRule({
  propertyType: "MetadataCommands",
  itemRule: MetadataCommandRules,
  xmlElement: "Command",
  keyField: "name",
})

registerProjectJSONSchema("MetadataCommand", ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: MetadataCommandRules })
)
