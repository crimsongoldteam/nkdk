import { ConfigurationContext, ConfigurationContextFromXML } from "../../context/types"
import { importMetadataItemFromYAML } from "../../orchestration"
import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToXML } from "../../orchestration/metadataCollection/toXML"
import { exportMetadataCollectionToYAMLAsRecord } from "../../orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "../../orchestration/property/fromXML"
import type { PropertyRule } from "../../orchestration/property/types"
import { MetadataHTTPServiceMethodRules } from "./rules"
import {
  MetadataHTTPServiceMethodYAML,
  MetadataHTTPServiceMethods,
  MetadataHTTPServiceMethodsXML,
  MetadataHTTPServiceMethodsYAML,
} from "./types"

const importMetadataHTTPServiceMethodsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataHTTPServiceMethodsYAML | undefined
): MetadataHTTPServiceMethods | undefined => {
  if (!data) return undefined

  const results = Object.entries(data).map(([name, value]) => {
    const properties = importMetadataItemFromYAML({
      context,
      yaml: value as MetadataHTTPServiceMethodYAML,
      rule: MetadataHTTPServiceMethodRules,
      name,
    })

    if (properties == undefined) throw new Error("Properties are required")

    return {
      ...properties,
      name,
    }
  })

  return results.length > 0 ? (results as MetadataHTTPServiceMethods) : undefined
}

registerMetadataItemCollectionRule({
  propertyType: "MetadataHTTPServiceMethods",
  itemRule: MetadataHTTPServiceMethodRules,
  xmlElement: "Method",
  keyField: "name",
  fromYAML: importMetadataHTTPServiceMethodsFromYAML,
  toXML: (params) => {
    if (Array.isArray(params.value) && params.value.length === 0 && "defaultValueXMLRaw" in params.rule) {
      return []
    }

    const effectiveXmlElement = (params.rule as any).xml === "Method" ? undefined : "Method"
    return exportMetadataCollectionToXML({
      context: params.context,
      rule: params.rule,
      data: params.value as MetadataHTTPServiceMethods | undefined,
      referenceData: params.referenceMetadata as MetadataHTTPServiceMethods | undefined,
      itemRule: MetadataHTTPServiceMethodRules,
      xmlElement: effectiveXmlElement,
      keyField: "name",
    })
  },
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
