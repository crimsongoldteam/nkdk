import { ConfigurationContext, ConfigurationContextFromXML } from "../../context/types"
import { importMetadataItemFromYAML } from "../../orchestration"
import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "../../orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "../../orchestration/property/fromXML"
import type { PropertyRule } from "../../orchestration/property/types"
import "../metadataHTTPServiceMethod/register"
import { MetadataHTTPServiceURLTemplateRules } from "./rules"
import {
  MetadataHTTPServiceURLTemplateYAML,
  MetadataHTTPServiceURLTemplates,
  MetadataHTTPServiceURLTemplatesXML,
  MetadataHTTPServiceURLTemplatesYAML,
} from "./types"

const importMetadataHTTPServiceURLTemplatesFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataHTTPServiceURLTemplatesYAML | undefined
): MetadataHTTPServiceURLTemplates | undefined => {
  if (!data) return undefined

  const results = Object.entries(data).map(([name, value]) => {
    const properties = importMetadataItemFromYAML({
      context,
      yaml: value as MetadataHTTPServiceURLTemplateYAML,
      rule: MetadataHTTPServiceURLTemplateRules,
      name,
    })

    if (properties == undefined) throw new Error("Properties are required")

    return {
      ...properties,
      name,
    }
  })

  return results.length > 0 ? (results as MetadataHTTPServiceURLTemplates) : undefined
}

registerMetadataItemCollectionRule({
  propertyType: "MetadataHTTPServiceURLTemplates",
  itemRule: MetadataHTTPServiceURLTemplateRules,
  xmlElement: "URLTemplate",
  keyField: "name",
  fromYAML: importMetadataHTTPServiceURLTemplatesFromYAML,
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
