import { defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataAccumulationRegisterRules } from "./rules"

export type MetadataAccumulationRegister = MetadataTypeByRule<typeof MetadataAccumulationRegisterRules>
export type MetadataAccumulationRegisterYAML = YAMLTypeByRule<typeof MetadataAccumulationRegisterRules>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataAccumulationRegister",
  itemRule: MetadataAccumulationRegisterRules,
})
