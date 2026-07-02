import { registerMetadataItemRule } from "../../../orchestration"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import { MetadataTypeByRule } from "../../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import "./collection/index"
import { StructureItemGroupRules } from "./rules"
import { exportStructureItemGroupToXML } from "./toXML"

export type StructureItemGroup = MetadataTypeByRule<typeof StructureItemGroupRules>
export type StructureItemGroupYAML = YAMLTypeByRule<typeof StructureItemGroupRules>

registerMetadataItemRule({
  propertyType: "StructureItemGroup",
  itemRule: StructureItemGroupRules,
})

registerTypeRule("StructureItemGroup", "exportToXML", exportStructureItemGroupToXML)
