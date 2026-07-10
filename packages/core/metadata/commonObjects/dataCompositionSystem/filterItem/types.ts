import { registerMetadataItemCollectionRule } from "../../../orchestration"
import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
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
  schemaName: "FilterItem",
  schemaShape: "schema",
})
