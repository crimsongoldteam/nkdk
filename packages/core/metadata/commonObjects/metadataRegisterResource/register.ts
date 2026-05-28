import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
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

    return {
      ...properties,
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
  graphChild: { idFrom: "name", edgeKind: "ATTRIBUTE", edgeYaml: "Ресурс", nodeSegment: "Ресурс" },
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
