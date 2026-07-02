import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import "~/metadata/commonObjects/metadataHTTPServiceMethod/register"
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
