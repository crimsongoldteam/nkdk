import { I8nTextXML } from "../../commonObjects/i8nText/types"
import { MetadataItemLinksXML } from "../../commonObjects/metadataRef/types"
import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import * as SE from "../../systemEnumerations/types"
import { MetadataFunctionalOptionsParameterRules } from "./rules"

export type MetadataFunctionalOptionsParameter = MetadataTypeByRule<typeof MetadataFunctionalOptionsParameterRules>
export type MetadataFunctionalOptionsParameterYAML = YAMLTypeByRule<typeof MetadataFunctionalOptionsParameterRules>

export interface MetadataFunctionalOptionsParameterXML {
  _version: string
  FunctionalOptionsParameter: {
    _uuid: string
    Properties: {
      Comment?: string
      Name: string
      ObjectBelonging?: SE.ObjectBelonging
      Synonym?: I8nTextXML
      Use?: MetadataItemLinksXML
    }
  }
}

registerMetadataItemRule({
  propertyType: "MetadataFunctionalOptionsParameter",
  itemRule: MetadataFunctionalOptionsParameterRules,
})
