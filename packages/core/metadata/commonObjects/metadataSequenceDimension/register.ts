import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { MetadataSequenceDimensionRules } from "./rules"

registerMetadataItemCollectionRule({
  propertyType: "MetadataSequenceDimensions",
  itemRule: MetadataSequenceDimensionRules,
  xmlElement: "Dimension",
  keyField: "name",
  collectionItemRule: true,
})
