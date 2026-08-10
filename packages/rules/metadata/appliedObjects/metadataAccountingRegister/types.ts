import { defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataAccountingRegisterRules } from "./rules"

export type MetadataAccountingRegister = MetadataTypeByRule<typeof MetadataAccountingRegisterRules>
export type MetadataAccountingRegisterYAML = YAMLTypeByRule<typeof MetadataAccountingRegisterRules>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataAccountingRegister",
  itemRule: MetadataAccountingRegisterRules,
})
