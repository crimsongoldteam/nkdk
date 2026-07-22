import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { MetadataHTTPServiceMethodRules } from "./rules"

registerMetadataItemCollectionRule({
  propertyType: "MetadataHTTPServiceMethods",
  itemRule: MetadataHTTPServiceMethodRules,
  xmlElement: "Method",
  keyField: "name",
  configurationIndexUidSegment: "Метод",
})
