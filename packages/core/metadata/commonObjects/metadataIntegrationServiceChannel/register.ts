import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { MetadataIntegrationServiceChannelRules } from "./rules"
import {
  MetadataIntegrationServiceChannelYAML,
  MetadataIntegrationServiceChannels,
  MetadataIntegrationServiceChannelsXML,
  MetadataIntegrationServiceChannelsYAML,
} from "./types"

const importMetadataIntegrationServiceChannelsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataIntegrationServiceChannelsYAML | undefined
): MetadataIntegrationServiceChannels | undefined => {
  if (!data) return undefined

  const results = Object.entries(data).map(([name, value]) => {
    const properties = importMetadataItemFromYAML({
      context,
      yaml: value as MetadataIntegrationServiceChannelYAML,
      rule: MetadataIntegrationServiceChannelRules,
      name,
    })

    if (properties == undefined) throw new Error("Properties are required")

    return {
      ...properties,
      name,
    }
  })

  return results.length > 0 ? (results as MetadataIntegrationServiceChannels) : undefined
}

registerMetadataItemCollectionRule({
  propertyType: "MetadataIntegrationServiceChannels",
  itemRule: MetadataIntegrationServiceChannelRules,
  xmlElement: "IntegrationServiceChannel",
  keyField: "name",
  fromYAML: importMetadataIntegrationServiceChannelsFromYAML,
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
