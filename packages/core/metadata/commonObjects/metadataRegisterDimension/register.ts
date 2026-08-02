import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { MetadataRegisterDimensionRules } from "./rules"

const propertyTypes = [
  "MetadataRegisterDimensions",
  "MetadataInformationRegisterDimensions",
  "MetadataAccumulationRegisterDimensions",
  "MetadataAccountingRegisterDimensions",
  "MetadataCalculationRegisterDimensions",
] as const

for (const propertyType of propertyTypes) {
  registerMetadataItemCollectionRule({
    propertyType,
    itemRule: MetadataRegisterDimensionRules,
    xmlElement: "Dimension",
    keyField: "name",
    collectionItemRule: true,
  })
}
