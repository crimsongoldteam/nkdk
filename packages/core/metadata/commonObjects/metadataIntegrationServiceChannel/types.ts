import { I8nTextXML } from "../i8nText/types"
import { InternalInfoItemsXML } from "../internalInfo/types"
import { MetadataNameYAML } from "../metadataName/types"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import * as SE from "../../systemEnumerations/types"
import { MetadataIntegrationServiceChannelRules } from "./rules"

export type MetadataIntegrationServiceChannel = MetadataTypeByRule<typeof MetadataIntegrationServiceChannelRules>

export type IntegrationServiceChannelInternalInfoParamsXML = [{ name: string; category: "Manager" }]

export interface MetadataIntegrationServiceChannelXML {
  _uuid?: string
  InternalInfo?: InternalInfoItemsXML<IntegrationServiceChannelInternalInfoParamsXML>
  Properties: {
    Comment?: string
    ExtendedConfigurationObject?: string
    ExternalIntegrationServiceChannelName?: string
    MessageDirection?: SE.IntegrationServiceChannelMessageDirection
    Name: string
    ObjectBelonging?: SE.ObjectBelonging
    ReceiveMessageProcessing?: string
    Synonym?: I8nTextXML
    Transactioned?: boolean
  }
}

export type MetadataIntegrationServiceChannelYAML = YAMLTypeByRule<typeof MetadataIntegrationServiceChannelRules>

export type MetadataIntegrationServiceChannels = MetadataIntegrationServiceChannel[]
export type MetadataIntegrationServiceChannelsXML =
  | MetadataIntegrationServiceChannelXML
  | MetadataIntegrationServiceChannelXML[]
export type MetadataIntegrationServiceChannelsYAML = Record<MetadataNameYAML, MetadataIntegrationServiceChannelYAML>
