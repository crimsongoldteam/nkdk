import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataXDTOPackageRules } from "./rules"

export type MetadataXDTOPackage = MetadataTypeByRule<typeof MetadataXDTOPackageRules>
export type MetadataXDTOPackageYAML = YAMLTypeByRule<typeof MetadataXDTOPackageRules>

registerMetadataItemRule({
  propertyType: "MetadataXDTOPackage",
  itemRule: MetadataXDTOPackageRules,
})
