import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataXDTOPackageRules } from "./rules"

export type MetadataXDTOPackage = MetadataTypeByRule<typeof MetadataXDTOPackageRules>
export type MetadataXDTOPackageYAML = YAMLTypeByRule<typeof MetadataXDTOPackageRules>

registerMetadataItemRule({
  propertyType: "MetadataXDTOPackage",
  itemRule: MetadataXDTOPackageRules,
})
