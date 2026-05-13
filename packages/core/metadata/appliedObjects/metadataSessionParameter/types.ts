import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { TypeDescriptionXML } from "~/metadata/commonObjects/typeDescription/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataSessionParameterRules } from "./rules"

export type MetadataSessionParameter = MetadataTypeByRule<typeof MetadataSessionParameterRules>
export type MetadataSessionParameterYAML = YAMLTypeByRule<typeof MetadataSessionParameterRules>

export interface MetadataSessionParameterXML {
  _version: string
  SessionParameter: {
    _uuid: string
    Properties: {
      Comment?: string
      Name: string
      ObjectBelonging?: SE.ObjectBelonging
      Synonym?: I8nTextXML
      Type?: TypeDescriptionXML
    }
  }
}

registerMetadataItemRule({
  propertyType: "MetadataSessionParameter",
  itemRule: MetadataSessionParameterRules,
})
