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
    itemRule: MetadataRegisterResourceRules,
    xmlElement: "Resource",
    keyField: "name",
    collectionItemRule: true,
  })
}
