import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataInformationRegisterRules } from "./rules"

export type MetadataInformationRegister = MetadataTypeByRule<typeof MetadataInformationRegisterRules>
export type MetadataInformationRegisterYAML = YAMLTypeByRule<typeof MetadataInformationRegisterRules>

registerMetadataItemRule({
  propertyType: "MetadataInformationRegister",
  itemRule: MetadataInformationRegisterRules,
})
