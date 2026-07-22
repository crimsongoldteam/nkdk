import { ConfigurationContext, ConfigurationContextFromXML } from "../../context/types"
import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "../../orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "../../orchestration/property/fromXML"
import type { PropertyRule } from "../../orchestration/property/types"
import "../metadataHTTPServiceMethod/register"
import { MetadataHTTPServiceURLTemplateRules } from "./rules"
import {
  MetadataHTTPServiceURLTemplates,
  MetadataHTTPServiceURLTemplatesXML,
  MetadataHTTPServiceURLTemplatesYAML,
} from "./types"

registerMetadataItemCollectionRule({
  propertyType: "MetadataHTTPServiceURLTemplates",
  itemRule: MetadataHTTPServiceURLTemplateRules,
  xmlElement: "URLTemplate",
  keyField: "name",
  configurationIndexUidSegment: "ШаблонURL",
})

export const importMetadataHTTPServiceURLTemplatesFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MetadataHTTPServiceURLTemplatesXML | undefined
): MetadataHTTPServiceURLTemplates | undefined => {
  return importPropertyFromXML({
    context,
    rule: { type: "MetadataHTTPServiceURLTemplates" },
    value: xml,
  }) as MetadataHTTPServiceURLTemplates | undefined
}

export const exportMetadataHTTPServiceURLTemplatesToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataHTTPServiceURLTemplates | undefined
): MetadataHTTPServiceURLTemplatesYAML | undefined => {
  return exportMetadataCollectionToYAMLAsRecord({
    context,
    data,
    itemRule: MetadataHTTPServiceURLTemplateRules,
    keyField: "name",
  }) as MetadataHTTPServiceURLTemplatesYAML | undefined
}
