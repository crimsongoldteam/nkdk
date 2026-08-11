import { defineMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import { composeMetadataRules } from "../../ruleRuntime/definition"
import { MetadataRegisterDimensionRules } from "./rules"

const propertyTypes = [
  "MetadataRegisterDimensions",
  "MetadataInformationRegisterDimensions",
  "MetadataAccumulationRegisterDimensions",
  "MetadataAccountingRegisterDimensions",
  "MetadataCalculationRegisterDimensions",
] as const

export const metadataRegisterDimensionCollectionRules = composeMetadataRules(
  ...propertyTypes.map((propertyType) =>
    defineMetadataItemCollectionRule({
    propertyType,
    ...(propertyType === "MetadataRegisterDimensions"
      ? {}
      : { schemaName: propertyType.replace(/Dimensions$/, "Dimension") }),
    itemRule: MetadataRegisterDimensionRules,
    xmlElement: "Dimension",
    keyField: "name",
    collectionItemRule: true,
    })),
)
