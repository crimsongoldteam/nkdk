import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataAccountingRegisterRules } from "./rules"

export type MetadataAccountingRegister = MetadataTypeByRule<typeof MetadataAccountingRegisterRules>
export type MetadataAccountingRegisterYAML = YAMLTypeByRule<typeof MetadataAccountingRegisterRules>

registerMetadataItemRule({
  propertyType: "MetadataAccountingRegister",
  itemRule: MetadataAccountingRegisterRules,
})
