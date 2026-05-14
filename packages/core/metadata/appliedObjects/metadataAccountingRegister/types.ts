import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataAccountingRegisterRules } from "./rules"

export type MetadataAccountingRegister = MetadataTypeByRule<typeof MetadataAccountingRegisterRules>
export type MetadataAccountingRegisterYAML = YAMLTypeByRule<typeof MetadataAccountingRegisterRules>

registerMetadataItemRule({
  propertyType: "MetadataAccountingRegister",
  itemRule: MetadataAccountingRegisterRules,
})
