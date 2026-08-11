import { defineMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import { composeMetadataRules } from "../../ruleRuntime/definition"
import { MetadataRegisterAttributeRules } from "./rules"

const propertyTypes = [
  "MetadataRegisterAttributes",
  "MetadataInformationRegisterAttributes",
  "MetadataAccumulationRegisterAttributes",
  "MetadataAccountingRegisterAttributes",
  "MetadataCalculationRegisterAttributes",
] as const

export const metadataRegisterAttributeCollectionRules = composeMetadataRules(
  ...propertyTypes.map((propertyType) =>
    defineMetadataItemCollectionRule({
    propertyType,
    ...(propertyType === "MetadataRegisterAttributes"
      ? {}
      : { schemaName: propertyType.replace(/Attributes$/, "Attribute") }),
    itemRule: MetadataRegisterAttributeRules,
    xmlElement: "Attribute",
    keyField: "name",
    collectionItemRule: true,
    })),
)
