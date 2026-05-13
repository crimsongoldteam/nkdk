import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataAccumulationRegisterRules } from "./rules"

export type MetadataAccumulationRegister = MetadataTypeByRule<typeof MetadataAccumulationRegisterRules>
export type MetadataAccumulationRegisterYAML = YAMLTypeByRule<typeof MetadataAccumulationRegisterRules>

registerMetadataItemRule({
  propertyType: "MetadataAccumulationRegister",
  itemRule: MetadataAccumulationRegisterRules,
})
