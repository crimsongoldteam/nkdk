import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataAccumulationRegisterRules } from "./rules"

export type MetadataAccumulationRegister = MetadataTypeByRule<typeof MetadataAccumulationRegisterRules>
export type MetadataAccumulationRegisterYAML = YAMLTypeByRule<typeof MetadataAccumulationRegisterRules>

registerMetadataItemRule({
  propertyType: "MetadataAccumulationRegister",
  itemRule: MetadataAccumulationRegisterRules,
})
