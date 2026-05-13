import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { TypeDescriptionXML } from "~/metadata/commonObjects/typeDescription/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataEventSubscriptionRules } from "./rules"

export type MetadataEventSubscription = MetadataTypeByRule<typeof MetadataEventSubscriptionRules>
export type MetadataEventSubscriptionYAML = YAMLTypeByRule<typeof MetadataEventSubscriptionRules>

export interface MetadataEventSubscriptionXML {
  _version: string
  EventSubscription: {
    _uuid: string
    Properties: {
      Comment?: string
      Event: string
      Handler: string
      Name: string
      ObjectBelonging?: SE.ObjectBelonging
      Source: TypeDescriptionXML
      Synonym?: I8nTextXML
    }
  }
}

registerMetadataItemRule({
  propertyType: "MetadataEventSubscription",
  itemRule: MetadataEventSubscriptionRules,
})
