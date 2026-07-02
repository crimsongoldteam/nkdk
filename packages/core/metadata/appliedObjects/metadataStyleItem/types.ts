import { StyleItemValueXML } from "../../commonObjects/styleItemValue/types"
import { I8nTextXML } from "../../commonObjects/i8nText/types"
import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import * as SE from "../../systemEnumerations/types"
import { MetadataStyleItemRules } from "./rules"

export type MetadataStyleItem = MetadataTypeByRule<typeof MetadataStyleItemRules>
export type MetadataStyleItemYAML = YAMLTypeByRule<typeof MetadataStyleItemRules>

export interface MetadataStyleItemXML {
  _version: string
  StyleItem: {
    _uuid: string
    Properties: {
      Comment?: string
      Name: string
      ObjectBelonging?: SE.ObjectBelonging
      Synonym?: I8nTextXML
      Type: SE.StyleElementType
      Value: StyleItemValueXML
    }
  }
}

registerMetadataItemRule({
  propertyType: "MetadataStyleItem",
  itemRule: MetadataStyleItemRules,
})
