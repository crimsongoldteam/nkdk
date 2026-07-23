import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { MetadataRegisterDimensionRules } from "./rules"

registerMetadataItemCollectionRule({
  propertyType: "MetadataRegisterDimensions",
  itemRule: MetadataRegisterDimensionRules,
  xmlElement: "Dimension",
  keyField: "name",
  collectionItemRule: true,
})
