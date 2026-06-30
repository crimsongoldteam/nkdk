import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataChartOfCharacteristicTypesRules } from "./rules"

export type MetadataChartOfCharacteristicTypes = MetadataTypeByRule<typeof MetadataChartOfCharacteristicTypesRules>
export type MetadataChartOfCharacteristicTypesYAML = YAMLTypeByRule<typeof MetadataChartOfCharacteristicTypesRules>

registerMetadataItemRule({
  propertyType: "MetadataChartOfCharacteristicTypes",
  itemRule: MetadataChartOfCharacteristicTypesRules,
})
