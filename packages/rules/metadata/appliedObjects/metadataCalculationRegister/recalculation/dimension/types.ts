import { defineMetadataItemCollectionRule } from "../../../../ruleRuntime"
import { MetadataTypeByRule } from "../../../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../../../ruleRuntime/metadataItem/yaml"
import { MetadataCalculationRegisterRecalculationDimensionRules } from "./rules"

export type MetadataCalculationRegisterRecalculationDimension = MetadataTypeByRule<
  typeof MetadataCalculationRegisterRecalculationDimensionRules
>
export type MetadataCalculationRegisterRecalculationDimensionYAML = YAMLTypeByRule<
  typeof MetadataCalculationRegisterRecalculationDimensionRules
>

export type MetadataCalculationRegisterRecalculationDimensions =
  MetadataCalculationRegisterRecalculationDimension[]
export type MetadataCalculationRegisterRecalculationDimensionsYAML = Record<
  string,
  MetadataCalculationRegisterRecalculationDimensionYAML
>

export const metadataRuleLayer000 = defineMetadataItemCollectionRule({
  propertyType: "MetadataCalculationRegisterRecalculationDimensions",
  itemRule: MetadataCalculationRegisterRecalculationDimensionRules,
  xmlElement: "Dimension",
  keyField: "name",
  configurationIndexUidSegment: "Измерение",
  collectionItemRule: true,
})
