import { I8nTextXML } from "../../commonObjects/i8nText/types"
import { InternalInfoItemsXML } from "../../commonObjects/internalInfo/types"
import {
  MetadataIntegrationServiceChannels,
  MetadataIntegrationServiceChannelsXML,
  MetadataIntegrationServiceChannelsYAML,
} from "../../commonObjects/metadataIntegrationServiceChannel/types"
import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import * as SE from "../../systemEnumerations/types"
import { MetadataIntegrationServiceRules } from "./rules"

export type MetadataIntegrationService = MetadataTypeByRule<typeof MetadataIntegrationServiceRules>
export type MetadataIntegrationServiceYAML = YAMLTypeByRule<typeof MetadataIntegrationServiceRules>

export type IntegrationServiceInternalInfoParamsXML = [{ name: string; category: "Manager" }]

export interface MetadataIntegrationServiceXML {
  _uuid?: string
  InternalInfo?: InternalInfoItemsXML<IntegrationServiceInternalInfoParamsXML>
  Properties: {
    Comment?: string
    ExtendedConfigurationObject?: string
    ExternalIntegrationServiceAddress?: string
    Name: string
    ObjectBelonging?: SE.ObjectBelonging
    Synonym?: I8nTextXML
  }
  ChildObjects?: {
    IntegrationServiceChannel?: MetadataIntegrationServiceChannelsXML
  }
}

export type {
  MetadataIntegrationServiceChannels,
  MetadataIntegrationServiceChannelsXML,
  MetadataIntegrationServiceChannelsYAML,
}

registerMetadataItemRule({
  propertyType: "MetadataIntegrationService",
  itemRule: MetadataIntegrationServiceRules,
})
