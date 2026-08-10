import { defineMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import { MetadataSequenceDimensionRules } from "./rules"

export const metadataRuleLayer000 = defineMetadataItemCollectionRule({
  propertyType: "MetadataSequenceDimensions",
  itemRule: MetadataSequenceDimensionRules,
  xmlElement: "Dimension",
  keyField: "name",
  collectionItemRule: true,
})
