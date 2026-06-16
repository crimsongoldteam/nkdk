import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { MetadataRegisterResourceRules } from "./rules"
import {
  MetadataRegisterResourceYAML,
  MetadataRegisterResources,
  MetadataRegisterResourcesXML,
  MetadataRegisterResourcesYAML,
} from "./types"

const hasEmptySynonym = (value: { synonym?: { items?: Record<string, string> } } | undefined): boolean =>
  value?.synonym !== undefined && Object.keys(value.synonym.items ?? {}).length === 0

const normalizeImplicitEmptySynonym = <T extends { synonym?: { items?: Record<string, string> } }>(
  context: ConfigurationContext,
  properties: T,
  source: T | undefined,
  name: string
): T => {
  if (!hasEmptySynonym(properties)) return properties
  if (hasEmptySynonym(source)) return properties

  return {
    ...properties,
    synonym: addDefaultLanguageNameToSynonym(context, undefined, name),
  }
}

const importMetadataRegisterResourcesFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataRegisterResourcesYAML | undefined,
  source: MetadataRegisterResources | undefined
): MetadataRegisterResources | undefined => {
  if (!data) return undefined

  const results = Object.entries(data).map(([name, value]) => {
    const itemSource = source?.find((item) => item.name === name)
    const properties = importMetadataItemFromYAML({
      context,
      yaml: value as MetadataRegisterResourceYAML,
      rule: MetadataRegisterResourceRules,
      name,
      source: itemSource,
    })

    if (properties == undefined) throw new Error("Properties are required")
    const normalizedProperties = normalizeImplicitEmptySynonym(context, properties, itemSource, name)

    return {
      ...normalizedProperties,
      name,
    }
  })

  return results.length > 0 ? (results as MetadataRegisterResources) : undefined
}

registerMetadataItemCollectionRule({
  propertyType: "MetadataRegisterResources",
  itemRule: MetadataRegisterResourceRules,
  xmlElement: "Resource",
  keyField: "name",
  fromYAML: importMetadataRegisterResourcesFromYAML,
  collectionItemRule: true,
})

export const importMetadataRegisterResourcesFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MetadataRegisterResourcesXML | undefined
): MetadataRegisterResources | undefined => {
  return importPropertyFromXML({
    context,
    rule: { type: "MetadataRegisterResources" },
    value: xml,
  }) as MetadataRegisterResources | undefined
}

export const exportMetadataRegisterResourcesToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataRegisterResources | undefined
): MetadataRegisterResourcesYAML | undefined => {
  return exportMetadataCollectionToYAMLAsRecord({
    context,
    data,
    itemRule: MetadataRegisterResourceRules,
    keyField: "name",
  }) as MetadataRegisterResourcesYAML | undefined
}
