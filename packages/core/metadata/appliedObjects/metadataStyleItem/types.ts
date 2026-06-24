import { StyleItemValueXML } from "~/metadata/commonObjects/styleItemValue/types"
import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import * as SE from "~/metadata/systemEnumerations/types"
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
