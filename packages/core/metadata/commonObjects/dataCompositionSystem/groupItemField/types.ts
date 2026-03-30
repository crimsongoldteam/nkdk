import { registerMetadataItemCollectionRule } from "~/metadata/orchestration"
import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { importGroupItemFromXML } from "./fromXML"
import { importGroupItemFromYAML } from "./fromYAML"
import { GroupItemAutoRules, GroupItemFieldRules } from "./rules"
import { exportGroupItemToXML } from "./toXML"
import { exportGroupItemToYAML } from "./toYAML"

export type GroupItemField = FormTypeByRule<typeof GroupItemFieldRules>
export type GroupItemAuto = FormTypeByRule<typeof GroupItemAutoRules>

export type GroupItemFieldYAML = YAMLTypeByRule<typeof GroupItemFieldRules>
export type GroupItemAutoYAML = YAMLTypeByRule<typeof GroupItemAutoRules>

export type GroupItem = (GroupItemField | GroupItemAuto)[]
export type GroupItemYAML = (GroupItemFieldYAML | GroupItemAutoYAML)[]

registerMetadataItemCollectionRule({
  propertyType: "GroupItem",
  itemRule: GroupItemFieldRules,
  xmlElement: "dcsset:item",
  fromXML: importGroupItemFromXML,
  fromYAML: importGroupItemFromYAML,
  toYAML: exportGroupItemToYAML,
  toXML: exportGroupItemToXML,
  yamlAsArray: true,
})
