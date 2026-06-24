import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { InternalInfoItemsXML } from "~/metadata/commonObjects/internalInfo/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataWSReferenceRules } from "./rules"

export type MetadataWSReference = MetadataTypeByRule<typeof MetadataWSReferenceRules>
export type MetadataWSReferenceYAML = YAMLTypeByRule<typeof MetadataWSReferenceRules>

export type WSReferenceInternalInfoParamsXML = [{ name: string; category: "Manager" }]

export interface MetadataWSReferenceXML {
  _version: string
  WSReference: {
    _uuid: string
    InternalInfo: InternalInfoItemsXML<WSReferenceInternalInfoParamsXML> | undefined
    Properties: {
      Comment?: string
      Name: string
      ObjectBelonging?: SE.ObjectBelonging
      Synonym?: I8nTextXML
      LocationURL: string
    }
  }
}

registerMetadataItemRule({
  propertyType: "MetadataWSReference",
  itemRule: MetadataWSReferenceRules,
})
