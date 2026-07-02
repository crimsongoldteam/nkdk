import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { MetadataSequenceDimensionRules } from "./rules"
import {
  MetadataSequenceDimensions,
  MetadataSequenceDimensionsXML,
  MetadataSequenceDimensionsYAML,
  MetadataSequenceDimensionYAML,
} from "./types"

const importMetadataSequenceDimensionsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataSequenceDimensionsYAML | undefined
): MetadataSequenceDimensions | undefined => {
  if (!data) return undefined

  const results = Object.entries(data).map(([name, value]) => {
    const properties = importMetadataItemFromYAML({
      context,
      yaml: value as MetadataSequenceDimensionYAML,
      rule: MetadataSequenceDimensionRules,
      name,
    })

    if (properties == undefined) throw new Error("Properties are required")

    return {
      ...properties,
      name,
    }
  })

  return results.length > 0 ? (results as MetadataSequenceDimensions) : undefined
}

registerMetadataItemCollectionRule({
  propertyType: "MetadataSequenceDimensions",
  itemRule: MetadataSequenceDimensionRules,
  xmlElement: "Dimension",
  keyField: "name",
  fromYAML: importMetadataSequenceDimensionsFromYAML,
  collectionItemRule: true,
})

export const importMetadataSequenceDimensionsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MetadataSequenceDimensionsXML | undefined
): MetadataSequenceDimensions | undefined => {
  return importPropertyFromXML({
    context,
    rule: { type: "MetadataSequenceDimensions" },
    value: xml,
  }) as MetadataSequenceDimensions | undefined
}

export const exportMetadataSequenceDimensionsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataSequenceDimensions | undefined
): MetadataSequenceDimensionsYAML | undefined => {
  return exportMetadataCollectionToYAMLAsRecord({
    context,
    data,
    itemRule: MetadataSequenceDimensionRules,
    keyField: "name",
  }) as MetadataSequenceDimensionsYAML | undefined
}
