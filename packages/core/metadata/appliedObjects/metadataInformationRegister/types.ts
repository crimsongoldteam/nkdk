import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataInformationRegisterRules } from "./rules"

export type MetadataInformationRegister = MetadataTypeByRule<typeof MetadataInformationRegisterRules>
export type MetadataInformationRegisterYAML = YAMLTypeByRule<typeof MetadataInformationRegisterRules>

registerMetadataItemRule({
  propertyType: "MetadataInformationRegister",
  itemRule: MetadataInformationRegisterRules,
})
