import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../../../orchestration/property/types"
import { GroupItemAuto, GroupItemAutoYAML } from "../items/groupItemAuto/types"
import { GroupItemField, GroupItemFieldYAML } from "../items/groupItemField/types"

export type StructureItemGroupCollectionItem = GroupItemField | GroupItemAuto

export type StructureItemGroupCollectionItemYAML = GroupItemFieldYAML | GroupItemAutoYAML

export type StructureItemGroupCollection = StructureItemGroupCollectionItem[]
export type StructureItemGroupCollectionYAML = StructureItemGroupCollectionItemYAML[]

export interface StructureItemGroupCollectionWidePropertyRule extends WidePropertyRuleBase {
  type: "StructureItemGroupCollection"
}

export type StructureItemGroupCollectionRuleParams = Omit<StructureItemGroupCollectionWidePropertyRule, "type">

export function structureItemGroupCollectionRule<const Params extends StructureItemGroupCollectionRuleParams>(
  params: WideExactRuleParams<StructureItemGroupCollectionRuleParams, Params>
): Readonly<{ type: "StructureItemGroupCollection" } & Params> {
  return defineWidePropertyRule("StructureItemGroupCollection", params)
}
