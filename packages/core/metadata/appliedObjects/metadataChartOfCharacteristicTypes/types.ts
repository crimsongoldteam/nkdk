import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataChartOfCharacteristicTypesRules } from "./rules"

export type MetadataChartOfCharacteristicTypes = MetadataTypeByRule<typeof MetadataChartOfCharacteristicTypesRules>
export type MetadataChartOfCharacteristicTypesYAML = YAMLTypeByRule<typeof MetadataChartOfCharacteristicTypesRules>

registerMetadataItemRule({
  propertyType: "MetadataChartOfCharacteristicTypes",
  itemRule: MetadataChartOfCharacteristicTypesRules,
})
