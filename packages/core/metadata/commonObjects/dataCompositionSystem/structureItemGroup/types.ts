import { registerMetadataItemRule, registerTypeRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import "./collection/index"
import { StructureItemGroupRules } from "./rules"
import { exportStructureItemGroupToXML } from "./toXML"
import { exportStructureItemGroupToYAML } from "./toYAML"

export type StructureItemGroup = MetadataTypeByRule<typeof StructureItemGroupRules>
export type StructureItemGroupYAML = YAMLTypeByRule<typeof StructureItemGroupRules>

registerMetadataItemRule({
  propertyType: "StructureItemGroup",
  itemRule: StructureItemGroupRules,
})

registerTypeRule("StructureItemGroup", "exportToXML", exportStructureItemGroupToXML)
registerTypeRule("StructureItemGroup", "exportToYAML", exportStructureItemGroupToYAML as any)
