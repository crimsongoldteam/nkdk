import { ConfigurationContext, ConfigurationContextFromXML } from "../../context/types"
import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "../../orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "../../orchestration/property/fromXML"
import type { PropertyRule } from "../../orchestration/property/types"
import { MetadataHTTPServiceMethodRules } from "./rules"
import { MetadataHTTPServiceMethods, MetadataHTTPServiceMethodsXML, MetadataHTTPServiceMethodsYAML } from "./types"

registerMetadataItemCollectionRule({
  propertyType: "MetadataHTTPServiceMethods",
  itemRule: MetadataHTTPServiceMethodRules,
  xmlElement: "Method",
  keyField: "name",
  configurationIndexUidSegment: "Метод",
})

export const importMetadataHTTPServiceMethodsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MetadataHTTPServiceMethodsXML | undefined
): MetadataHTTPServiceMethods | undefined => {
  return importPropertyFromXML({
    context,
    rule: { type: "MetadataHTTPServiceMethods" },
    value: xml,
  }) as MetadataHTTPServiceMethods | undefined
}

export const exportMetadataHTTPServiceMethodsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataHTTPServiceMethods | undefined
): MetadataHTTPServiceMethodsYAML | undefined => {
  return exportMetadataCollectionToYAMLAsRecord({
    context,
    data,
    itemRule: MetadataHTTPServiceMethodRules,
    keyField: "name",
  }) as MetadataHTTPServiceMethodsYAML | undefined
}
