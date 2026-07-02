import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { MetadataRegisterDimensionRules } from "./rules"
import {
  MetadataRegisterDimensionYAML,
  MetadataRegisterDimensions,
  MetadataRegisterDimensionsXML,
  MetadataRegisterDimensionsYAML,
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

const importMetadataRegisterDimensionsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataRegisterDimensionsYAML | undefined,
  source: MetadataRegisterDimensions | undefined
): MetadataRegisterDimensions | undefined => {
  if (!data) return undefined

  const results = Object.entries(data).map(([name, value]) => {
    const itemSource = source?.find((item) => item.name === name)
    const properties = importMetadataItemFromYAML({
      context,
      yaml: value as MetadataRegisterDimensionYAML,
      rule: MetadataRegisterDimensionRules,
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

  return results.length > 0 ? (results as MetadataRegisterDimensions) : undefined
}

registerMetadataItemCollectionRule({
  propertyType: "MetadataRegisterDimensions",
  itemRule: MetadataRegisterDimensionRules,
  xmlElement: "Dimension",
  keyField: "name",
  fromYAML: importMetadataRegisterDimensionsFromYAML,
  collectionItemRule: true,
})

export const importMetadataRegisterDimensionsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MetadataRegisterDimensionsXML | undefined
): MetadataRegisterDimensions | undefined => {
  return importPropertyFromXML({
    context,
    rule: { type: "MetadataRegisterDimensions" },
    value: xml,
  }) as MetadataRegisterDimensions | undefined
}

export const exportMetadataRegisterDimensionsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataRegisterDimensions | undefined
): MetadataRegisterDimensionsYAML | undefined => {
  return exportMetadataCollectionToYAMLAsRecord({
    context,
    data,
    itemRule: MetadataRegisterDimensionRules,
    keyField: "name",
  }) as MetadataRegisterDimensionsYAML | undefined
}
