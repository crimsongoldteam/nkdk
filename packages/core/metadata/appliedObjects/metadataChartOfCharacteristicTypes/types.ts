import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataChartOfCharacteristicTypesRules } from "./rules"

export type MetadataChartOfCharacteristicTypes = MetadataTypeByRule<typeof MetadataChartOfCharacteristicTypesRules>
export type MetadataChartOfCharacteristicTypesYAML = YAMLTypeByRule<typeof MetadataChartOfCharacteristicTypesRules>

registerMetadataItemRule({
  propertyType: "MetadataChartOfCharacteristicTypes",
  itemRule: MetadataChartOfCharacteristicTypesRules,
})
