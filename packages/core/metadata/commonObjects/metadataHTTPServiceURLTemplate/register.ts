import { registerMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import "../metadataHTTPServiceMethod/register"
import { MetadataHTTPServiceURLTemplateRules } from "./rules"

registerMetadataItemCollectionRule({
  propertyType: "MetadataHTTPServiceURLTemplates",
  itemRule: MetadataHTTPServiceURLTemplateRules,
  xmlElement: "URLTemplate",
  keyField: "name",
  configurationIndexUidSegment: "ШаблонURL",
})
