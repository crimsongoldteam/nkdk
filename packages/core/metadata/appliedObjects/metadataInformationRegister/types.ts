import { defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataInformationRegisterRules } from "./rules"

export type MetadataInformationRegister = MetadataTypeByRule<typeof MetadataInformationRegisterRules>
export type MetadataInformationRegisterYAML = YAMLTypeByRule<typeof MetadataInformationRegisterRules>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataInformationRegister",
  itemRule: MetadataInformationRegisterRules,
})
