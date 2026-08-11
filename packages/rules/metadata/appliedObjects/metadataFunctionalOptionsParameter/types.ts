import { I8nTextXML } from "../../commonObjects/i8nText/types"
import { MetadataItemLinksXML } from "../../commonObjects/metadataRef/types"
import { defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
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

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataFunctionalOptionsParameter",
  itemRule: MetadataFunctionalOptionsParameterRules,
})
