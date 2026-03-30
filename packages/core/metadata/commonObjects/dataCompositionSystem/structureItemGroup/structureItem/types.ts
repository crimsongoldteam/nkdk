import { registerMetadataItemCollectionRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { StructureItemGroupRules } from "../rules"
import { importStructureItemFromXML } from "./fromXML"
import { importStructureItemFromYAML } from "./fromYAML"
import { exportStructureItemToXML } from "./toXML"
import { exportStructureItemToYAML } from "./toYAML"

export type StructureItemElement = MetadataTypeByRule<typeof StructureItemGroupRules>
export type StructureItemElementYAML = YAMLTypeByRule<typeof StructureItemGroupRules>

export type StructureItem = StructureItemElement[]
export type StructureItemYAML = StructureItemElementYAML[]

registerMetadataItemCollectionRule({
  propertyType: "StructureItem",
  itemRule: StructureItemGroupRules,
  xmlElement: "dcsset:item",
  fromXML: importStructureItemFromXML,
  fromYAML: importStructureItemFromYAML,
  toYAML: exportStructureItemToYAML,
  toXML: exportStructureItemToXML,
  yamlAsArray: true,
})
