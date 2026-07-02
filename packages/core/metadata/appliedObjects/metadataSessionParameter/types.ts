import { I8nTextXML } from "../../commonObjects/i8nText/types"
import { TypeDescriptionXML } from "../../commonObjects/typeDescription/types"
import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import * as SE from "../../systemEnumerations/types"
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
