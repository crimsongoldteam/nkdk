import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { MetadataCommandRules } from "./rules"
import { MetadataCommands, MetadataCommandsXML, MetadataCommandsYAML } from "./types"

registerMetadataItemCollectionRule({
  propertyType: "MetadataCommands",
  itemRule: MetadataCommandRules,
  xmlElement: "Command",
  keyField: "name",
})

// Compat exports for consumers that call these functions directly
export const importMetadataCommandsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MetadataCommandsXML | undefined
): MetadataCommands | undefined => {
  return importPropertyFromXML({ context, rule: { type: "MetadataCommands" }, value: xml }) as MetadataCommands | undefined
}

export const exportMetadataCommandsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataCommands | undefined
): MetadataCommandsYAML | undefined => {
  return exportMetadataCollectionToYAMLAsRecord({
    context,
    data,
    itemRule: MetadataCommandRules,
    keyField: "name",
  }) as MetadataCommandsYAML | undefined
}
