import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataCommandXML } from "../metadataCommand/types"
import { MetadataCommonCommandRules } from "./rules"

export type MetadataCommonCommand = MetadataTypeByRule<typeof MetadataCommonCommandRules>
export type MetadataCommonCommandYAML = YAMLTypeByRule<typeof MetadataCommonCommandRules>

export interface MetadataCommonCommandXML {
  _version: string
  CommonCommand: MetadataCommandXML
}

registerMetadataItemRule({
  propertyType: "MetadataCommonCommand",
  itemRule: MetadataCommonCommandRules,
})
