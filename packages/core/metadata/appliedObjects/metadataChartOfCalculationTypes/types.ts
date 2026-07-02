import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataChartOfCalculationTypesRules } from "./rules"

export type MetadataChartOfCalculationTypes = MetadataTypeByRule<typeof MetadataChartOfCalculationTypesRules>
export type MetadataChartOfCalculationTypesYAML = YAMLTypeByRule<typeof MetadataChartOfCalculationTypesRules>

registerMetadataItemRule({
  propertyType: "MetadataChartOfCalculationTypes",
  itemRule: MetadataChartOfCalculationTypesRules,
})
