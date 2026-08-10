import { defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataCalculationRegisterRules } from "./rules"

export type MetadataCalculationRegister = MetadataTypeByRule<typeof MetadataCalculationRegisterRules>
export type MetadataCalculationRegisterYAML = YAMLTypeByRule<typeof MetadataCalculationRegisterRules>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataCalculationRegister",
  itemRule: MetadataCalculationRegisterRules,
})
