import { defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataXDTOPackageRules } from "./rules"

export type MetadataXDTOPackage = MetadataTypeByRule<typeof MetadataXDTOPackageRules>
export type MetadataXDTOPackageYAML = YAMLTypeByRule<typeof MetadataXDTOPackageRules>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataXDTOPackage",
  itemRule: MetadataXDTOPackageRules,
})
