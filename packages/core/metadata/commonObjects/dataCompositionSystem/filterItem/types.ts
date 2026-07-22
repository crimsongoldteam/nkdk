import { registerMetadataItemCollectionRule, registerTypeRule } from "../../../orchestration"
import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { importFilterItemFromXMLToYAML } from "./fromXMLToYAML"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"
import { exportFilterItemToJSONSchema } from "./toJSONSchema"

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
  fromXMLToYAML: importFilterItemFromXMLToYAML,
  toJSONSchema: exportFilterItemToJSONSchema,
  yamlAsArray: true,
  configurationIndexAddressing: "yamlPath",
  schemaName: "FilterItem",
  schemaShape: "schema",
})

registerTypeRule("FilterItem", "yamlToXMLNestedRule", {
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
