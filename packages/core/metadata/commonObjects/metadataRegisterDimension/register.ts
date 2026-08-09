import { registerMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
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
    ...(propertyType === "MetadataRegisterDimensions"
      ? {}
      : { schemaName: propertyType.replace(/Dimensions$/, "Dimension") }),
    itemRule: MetadataRegisterDimensionRules,
    xmlElement: "Dimension",
    keyField: "name",
    collectionItemRule: true,
  })
}
