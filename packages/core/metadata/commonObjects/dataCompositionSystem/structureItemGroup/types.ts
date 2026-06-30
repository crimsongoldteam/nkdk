import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
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

export interface StructureItemGroupWidePropertyRule extends WidePropertyRuleBase {
  type: "StructureItemGroup"
}

export type StructureItemGroupRuleParams = Omit<StructureItemGroupWidePropertyRule, "type">

export function structureItemGroupRule<const Params extends StructureItemGroupRuleParams>(
  params: WideExactRuleParams<StructureItemGroupRuleParams, Params>
): Readonly<{ type: "StructureItemGroup" } & Params> {
  return defineWidePropertyRule("StructureItemGroup", params)
}
