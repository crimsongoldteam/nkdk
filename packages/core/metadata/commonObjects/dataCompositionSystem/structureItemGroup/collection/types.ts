import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../../../orchestration/property/types"
import { registerTypeRule } from "../../../../orchestration/property/typeRuleRegistry"
import { GroupItemAutoRules } from "../items/groupItemAuto/rules"
import { detectGroupItemAutoYAML } from "../items/groupItemAuto/detectYAML"
import { GroupItemFieldRules } from "../items/groupItemField/rules"
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
  return defineWidePropertyRule("StructureItemGroupCollection", {
    configurationIndexAddressing: "yamlPath" as const,
    ...params,
  })
}

registerTypeRule("StructureItemGroupCollection", "yamlToXMLNestedRule", {
  kind: "collection",
  itemRule: GroupItemFieldRules,
  resolveItemRule: ({ yaml }) => (detectGroupItemAutoYAML(yaml) ? GroupItemAutoRules : GroupItemFieldRules),
  normalizeItemYAML: ({ yaml }) => {
    if (yaml === "[Авто]") return {}
    if (yaml === "([Авто])") return { Использование: false }
    if (typeof yaml !== "string") return yaml
    const disabled = yaml.startsWith("(") && yaml.endsWith(")")
    return { Поле: disabled ? yaml.slice(1, -1) : yaml, ...(disabled ? { Использование: false } : {}) }
  },
  yamlShape: "array",
  configurationIndexAddressing: "yamlPath",
})
