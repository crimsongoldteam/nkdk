import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { defineMetadataItemCollectionRule } from "../../../ruleRuntime/metadataCollection/ruleFactory"
import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { importFilterItemFromXMLToYAML } from "./fromXMLToYAML"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"
import { exportFilterItemToJSONSchema } from "./toJSONSchema"
import "./typedValues"

export type FilterItemComparison = FormTypeByRule<typeof FilterItemComparisonRules>
export type FilterItemComparisonYAML = YAMLTypeByRule<typeof FilterItemComparisonRules>

export type FilterItemGroup = FormTypeByRule<typeof FilterItemGroupRules>
export type FilterItemGroupYAML = YAMLTypeByRule<typeof FilterItemGroupRules>

export type FilterItem = (FilterItemComparison | FilterItemGroup)[]
export type FilterItemYAML = (FilterItemComparisonYAML | FilterItemGroupYAML)[]

export const metadataRuleLayer000 = defineMetadataItemCollectionRule({
  propertyType: "FilterItem",
  itemRule: FilterItemComparisonRules,
  xmlElement: "dcsset:item",
  fromXMLToYAML: importFilterItemFromXMLToYAML,
  toJSONSchema: exportFilterItemToJSONSchema,
  yamlAsArray: true,
  configurationIndexAddressing: "yamlPath",
  schemaName: "FilterItem",
  schemaShape: "schema",
})

export const metadataPropertyRule000 = definePropertyTypeRule("FilterItem", "yamlToXMLNestedRule", {
  kind: "collection",
  itemRule: FilterItemComparisonRules,
  resolveItemRule: ({ yaml }) =>
    yaml !== null && typeof yaml === "object" && !Array.isArray(yaml) && "ТипГруппы" in yaml
      ? FilterItemGroupRules
      : FilterItemComparisonRules,
  yamlShape: "array",
  xmlElement: "dcsset:item",
  configurationIndexAddressing: "yamlPath",
})
