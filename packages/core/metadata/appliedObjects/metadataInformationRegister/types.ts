import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataInformationRegisterRules } from "./rules"

export type MetadataInformationRegister = MetadataTypeByRule<typeof MetadataInformationRegisterRules>
export type MetadataInformationRegisterYAML = YAMLTypeByRule<typeof MetadataInformationRegisterRules>

registerMetadataItemRule({
  propertyType: "MetadataInformationRegister",
  itemRule: MetadataInformationRegisterRules,
})
