import { registerMetadataItemRule } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
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
