import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataChartOfCalculationTypesRules } from "./rules"

export type MetadataChartOfCalculationTypes = MetadataTypeByRule<typeof MetadataChartOfCalculationTypesRules>
export type MetadataChartOfCalculationTypesYAML = YAMLTypeByRule<typeof MetadataChartOfCalculationTypesRules>

registerMetadataItemRule({
  propertyType: "MetadataChartOfCalculationTypes",
  itemRule: MetadataChartOfCalculationTypesRules,
})
