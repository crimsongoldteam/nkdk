import { I8nTextXML } from "../../commonObjects/i8nText/types"
import { PictureXML } from "../../commonObjects/picture/types"
import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import * as SE from "../../systemEnumerations/types"
import { MetadataBotRules } from "./rules"

export type MetadataBot = MetadataTypeByRule<typeof MetadataBotRules>
export type MetadataBotYAML = YAMLTypeByRule<typeof MetadataBotRules>

export interface MetadataBotXML {
  _version: string
  Bot: {
    _uuid: string
    Properties: {
      Comment?: string
      Name: string
      ObjectBelonging?: SE.ObjectBelonging
      Synonym?: I8nTextXML
      Predefined: boolean
      Picture?: PictureXML
    }
  }
}

registerMetadataItemRule({
  propertyType: "MetadataBot",
  itemRule: MetadataBotRules,
})
