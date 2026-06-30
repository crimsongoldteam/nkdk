import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration"
import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { importFilterItemFromXML } from "./fromXML"
import { importFilterItemFromYAML } from "./fromYAML"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"
import { exportFilterItemToJSONSchema } from "./toJSONSchema"
import { exportFilterItemToXML } from "./toXML"
import { exportFilterItemToYAML } from "./toYAML"

export type FilterItemComparison = FormTypeByRule<typeof FilterItemComparisonRules>
export type FilterItemComparisonYAML = YAMLTypeByRule<typeof FilterItemComparisonRules>

export type FilterItemGroup = FormTypeByRule<typeof FilterItemGroupRules>
export type FilterItemGroupYAML = YAMLTypeByRule<typeof FilterItemGroupRules>

export type FilterItem = (FilterItemComparison | FilterItemGroup)[]
export type FilterItemYAML = (FilterItemComparisonYAML | FilterItemGroupYAML)[]

registerMetadataItemCollectionRule({
  propertyType: "FilterItem",
  itemRule: FilterItemComparisonRules,
  xmlElement: "dcsset:item",
  fromXML: importFilterItemFromXML,
  fromYAML: importFilterItemFromYAML,
  toYAML: exportFilterItemToYAML,
  toXML: exportFilterItemToXML,
  toJSONSchema: exportFilterItemToJSONSchema,
  yamlAsArray: true,
})

export interface FilterItemPresentationValueWidePropertyRule extends WidePropertyRuleBase {
  type: "FilterItemPresentationValue"
}

export type FilterItemPresentationValueRuleParams = Omit<FilterItemPresentationValueWidePropertyRule, "type">

export function filterItemPresentationValueRule<const Params extends FilterItemPresentationValueRuleParams>(
  params: WideExactRuleParams<FilterItemPresentationValueRuleParams, Params>
): Readonly<{ type: "FilterItemPresentationValue" } & Params> {
  return defineWidePropertyRule("FilterItemPresentationValue", params)
}
