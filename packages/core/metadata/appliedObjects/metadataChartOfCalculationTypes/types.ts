import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataChartOfCalculationTypesRules } from "./rules"

export type MetadataChartOfCalculationTypes = MetadataTypeByRule<typeof MetadataChartOfCalculationTypesRules>
export type MetadataChartOfCalculationTypesYAML = YAMLTypeByRule<typeof MetadataChartOfCalculationTypesRules>

registerMetadataItemRule({
  propertyType: "MetadataChartOfCalculationTypes",
  itemRule: MetadataChartOfCalculationTypesRules,
})
