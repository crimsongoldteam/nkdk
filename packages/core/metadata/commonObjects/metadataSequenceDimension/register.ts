import { registerMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import { MetadataSequenceDimensionRules } from "./rules"

registerMetadataItemCollectionRule({
  propertyType: "MetadataSequenceDimensions",
  itemRule: MetadataSequenceDimensionRules,
  xmlElement: "Dimension",
  keyField: "name",
  collectionItemRule: true,
})
