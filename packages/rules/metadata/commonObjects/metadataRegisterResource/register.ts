import { defineMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import { composeMetadataRules } from "../../ruleRuntime/definition"
import { MetadataRegisterResourceRules } from "./rules"

const propertyTypes = [
  "MetadataRegisterResources",
  "MetadataInformationRegisterResources",
  "MetadataAccumulationRegisterResources",
  "MetadataAccountingRegisterResources",
  "MetadataCalculationRegisterResources",
] as const

export const metadataRegisterResourceCollectionRules = composeMetadataRules(
  ...propertyTypes.map((propertyType) =>
    defineMetadataItemCollectionRule({
    propertyType,
    ...(propertyType === "MetadataRegisterResources"
      ? {}
      : { schemaName: propertyType.replace(/Resources$/, "Resource") }),
    itemRule: MetadataRegisterResourceRules,
    xmlElement: "Resource",
    keyField: "name",
    collectionItemRule: true,
    })),
)
