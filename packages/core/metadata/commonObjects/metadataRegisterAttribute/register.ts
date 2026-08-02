import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { MetadataRegisterAttributeRules } from "./rules"

const propertyTypes = [
  "MetadataRegisterAttributes",
  "MetadataInformationRegisterAttributes",
  "MetadataAccumulationRegisterAttributes",
  "MetadataAccountingRegisterAttributes",
  "MetadataCalculationRegisterAttributes",
] as const

for (const propertyType of propertyTypes) {
  registerMetadataItemCollectionRule({
    propertyType,
    itemRule: MetadataRegisterAttributeRules,
    xmlElement: "Attribute",
    keyField: "name",
    collectionItemRule: true,
  })
}
