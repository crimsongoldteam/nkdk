import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataXDTOPackageRules } from "./rules"

export type MetadataXDTOPackage = MetadataTypeByRule<typeof MetadataXDTOPackageRules>
export type MetadataXDTOPackageYAML = YAMLTypeByRule<typeof MetadataXDTOPackageRules>

registerMetadataItemRule({
  propertyType: "MetadataXDTOPackage",
  itemRule: MetadataXDTOPackageRules,
})
