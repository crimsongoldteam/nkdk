import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataCalculationRegisterRules } from "./rules"

export type MetadataCalculationRegister = MetadataTypeByRule<typeof MetadataCalculationRegisterRules>
export type MetadataCalculationRegisterYAML = YAMLTypeByRule<typeof MetadataCalculationRegisterRules>

registerMetadataItemRule({
  propertyType: "MetadataCalculationRegister",
  itemRule: MetadataCalculationRegisterRules,
})
