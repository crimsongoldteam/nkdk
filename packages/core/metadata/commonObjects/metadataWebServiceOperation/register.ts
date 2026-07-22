import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { MetadataWebServiceOperationRules, MetadataWebServiceParameterRules } from "./rules"

registerMetadataItemCollectionRule({
  propertyType: "MetadataWebServiceParameters",
  itemRule: MetadataWebServiceParameterRules,
  xmlElement: "Parameter",
  keyField: "name",
  configurationIndexUidSegment: "Параметр",
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataWebServiceOperations",
  itemRule: MetadataWebServiceOperationRules,
  xmlElement: "Operation",
  keyField: "name",
  configurationIndexUidSegment: "Операция",
})
