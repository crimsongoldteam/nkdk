import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { MetadataIntegrationServiceChannelRules } from "./rules"

registerMetadataItemCollectionRule({
  propertyType: "MetadataIntegrationServiceChannels",
  itemRule: MetadataIntegrationServiceChannelRules,
  xmlElement: "IntegrationServiceChannel",
  keyField: "name",
  configurationIndexUidSegment: "Канал",
})
