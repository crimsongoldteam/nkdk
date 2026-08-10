import { defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataChartOfCalculationTypesRules } from "./rules"

export type MetadataChartOfCalculationTypes = MetadataTypeByRule<typeof MetadataChartOfCalculationTypesRules>
export type MetadataChartOfCalculationTypesYAML = YAMLTypeByRule<typeof MetadataChartOfCalculationTypesRules>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataChartOfCalculationTypes",
  itemRule: MetadataChartOfCalculationTypesRules,
})
