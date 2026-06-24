import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { MetadataItemLinksXML } from "~/metadata/commonObjects/metadataRef/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import * as SE from "~/metadata/systemEnumerations/types"
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
