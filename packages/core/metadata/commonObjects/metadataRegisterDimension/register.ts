import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { MetadataRegisterDimensionRules } from "./rules"
import {
  MetadataRegisterDimensionYAML,
  MetadataRegisterDimensions,
  MetadataRegisterDimensionsXML,
  MetadataRegisterDimensionsYAML,
} from "./types"

const dropImplicitEmptySynonym = <T extends { synonym?: { items?: Record<string, string> } }>(properties: T): T => {
  if (properties.synonym && Object.keys(properties.synonym.items ?? {}).length === 0) {
    const { synonym: _synonym, ...rest } = properties
    return rest as T
  }

  return properties
}

const importMetadataRegisterDimensionsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataRegisterDimensionsYAML | undefined
): MetadataRegisterDimensions | undefined => {
  if (!data) return undefined

  const results = Object.entries(data).map(([name, value]) => {
    const properties = importMetadataItemFromYAML({
      context,
      yaml: value as MetadataRegisterDimensionYAML,
      rule: MetadataRegisterDimensionRules,
      name,
    })

    if (properties == undefined) throw new Error("Properties are required")

    return {
      ...dropImplicitEmptySynonym(properties),
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
  graphChild: { idFrom: "name", edgeKind: "DIMENSION", edgeYaml: "Измерение", nodeSegment: "Измерение" },
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
