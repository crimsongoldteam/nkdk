import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataAccumulationRegisterRules } from "./rules"

export type MetadataAccumulationRegister = MetadataTypeByRule<typeof MetadataAccumulationRegisterRules>
export type MetadataAccumulationRegisterYAML = YAMLTypeByRule<typeof MetadataAccumulationRegisterRules>

registerMetadataItemRule({
  propertyType: "MetadataAccumulationRegister",
  itemRule: MetadataAccumulationRegisterRules,
})
