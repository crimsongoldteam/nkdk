import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { PictureXML } from "~/metadata/commonObjects/picture/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import * as SE from "~/metadata/systemEnumerations/types"
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
