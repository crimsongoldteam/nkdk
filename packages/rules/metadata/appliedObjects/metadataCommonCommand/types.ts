import { defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataCommandXML } from "../metadataCommand/types"
import { MetadataCommonCommandRules } from "./rules"

export type MetadataCommonCommand = MetadataTypeByRule<typeof MetadataCommonCommandRules>
export type MetadataCommonCommandYAML = YAMLTypeByRule<typeof MetadataCommonCommandRules>

export interface MetadataCommonCommandXML {
  _version: string
  CommonCommand: MetadataCommandXML
}

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataCommonCommand",
  itemRule: MetadataCommonCommandRules,
})
