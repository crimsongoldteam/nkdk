import { ConfigurationContext, ConfigurationContextFromXML } from "../../context/types"
import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "../../orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "../../orchestration/property/fromXML"
import type { PropertyRule } from "../../orchestration/property/types"
import { MetadataIntegrationServiceChannelRules } from "./rules"
import {
  MetadataIntegrationServiceChannels,
  MetadataIntegrationServiceChannelsXML,
  MetadataIntegrationServiceChannelsYAML,
} from "./types"

registerMetadataItemCollectionRule({
  propertyType: "MetadataIntegrationServiceChannels",
  itemRule: MetadataIntegrationServiceChannelRules,
  xmlElement: "IntegrationServiceChannel",
  keyField: "name",
  configurationIndexUidSegment: "Канал",
})

export const importMetadataIntegrationServiceChannelsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MetadataIntegrationServiceChannelsXML | undefined
): MetadataIntegrationServiceChannels | undefined => {
  return importPropertyFromXML({
    context,
    rule: { type: "MetadataIntegrationServiceChannels" },
    value: xml,
  }) as MetadataIntegrationServiceChannels | undefined
}

export const exportMetadataIntegrationServiceChannelsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataIntegrationServiceChannels | undefined
): MetadataIntegrationServiceChannelsYAML | undefined => {
  return exportMetadataCollectionToYAMLAsRecord({
    context,
    data,
    itemRule: MetadataIntegrationServiceChannelRules,
    keyField: "name",
  }) as MetadataIntegrationServiceChannelsYAML | undefined
}
