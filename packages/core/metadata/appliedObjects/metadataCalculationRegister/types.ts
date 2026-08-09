import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataCalculationRegisterRules } from "./rules"

export type MetadataCalculationRegister = MetadataTypeByRule<typeof MetadataCalculationRegisterRules>
export type MetadataCalculationRegisterYAML = YAMLTypeByRule<typeof MetadataCalculationRegisterRules>

registerMetadataItemRule({
  propertyType: "MetadataCalculationRegister",
  itemRule: MetadataCalculationRegisterRules,
})
