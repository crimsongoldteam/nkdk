import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { MetadataNameYAML } from "~/metadata/commonObjects/metadataName/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataIntegrationServiceChannelRules } from "./rules"

export type MetadataIntegrationServiceChannel = MetadataTypeByRule<typeof MetadataIntegrationServiceChannelRules>

export interface MetadataIntegrationServiceChannelXML {
  _uuid?: string
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
export type MetadataIntegrationServiceChannelsYAML = Record<
  MetadataNameYAML,
  MetadataIntegrationServiceChannelYAML
>
