import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { MetadataRegisterResourceRules } from "./rules"

const propertyTypes = [
  "MetadataRegisterResources",
  "MetadataInformationRegisterResources",
  "MetadataAccumulationRegisterResources",
  "MetadataAccountingRegisterResources",
  "MetadataCalculationRegisterResources",
] as const

for (const propertyType of propertyTypes) {
  registerMetadataItemCollectionRule({
    propertyType,
    ...(propertyType === "MetadataRegisterResources"
      ? {}
      : { schemaName: propertyType.replace(/Resources$/, "Resource") }),
    itemRule: MetadataRegisterResourceRules,
    xmlElement: "Resource",
    keyField: "name",
    collectionItemRule: true,
  })
}
