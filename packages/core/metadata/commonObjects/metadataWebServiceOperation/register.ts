import { defineMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import { MetadataWebServiceOperationRules, MetadataWebServiceParameterRules } from "./rules"

export const metadataRuleLayer000 = defineMetadataItemCollectionRule({
  propertyType: "MetadataWebServiceParameters",
  itemRule: MetadataWebServiceParameterRules,
  xmlElement: "Parameter",
  keyField: "name",
  configurationIndexUidSegment: "Параметр",
})

export const metadataRuleLayer001 = defineMetadataItemCollectionRule({
  propertyType: "MetadataWebServiceOperations",
  itemRule: MetadataWebServiceOperationRules,
  xmlElement: "Operation",
  keyField: "name",
  configurationIndexUidSegment: "Операция",
})
