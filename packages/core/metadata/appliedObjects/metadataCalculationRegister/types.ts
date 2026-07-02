import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataCalculationRegisterRules } from "./rules"

export type MetadataCalculationRegister = MetadataTypeByRule<typeof MetadataCalculationRegisterRules>
export type MetadataCalculationRegisterYAML = YAMLTypeByRule<typeof MetadataCalculationRegisterRules>

registerMetadataItemRule({
  propertyType: "MetadataCalculationRegister",
  itemRule: MetadataCalculationRegisterRules,
})
