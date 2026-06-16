import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { MetadataRegisterAttributeRules } from "./rules"
import {
  MetadataRegisterAttributeYAML,
  MetadataRegisterAttributes,
  MetadataRegisterAttributesXML,
  MetadataRegisterAttributesYAML,
} from "./types"

const dropImplicitEmptySynonym = <T extends { synonym?: { items?: Record<string, string> } }>(properties: T): T => {
  if (properties.synonym && Object.keys(properties.synonym.items ?? {}).length === 0) {
    const { synonym: _synonym, ...rest } = properties
    return rest as T
  }

  return properties
}

const importMetadataRegisterAttributesFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataRegisterAttributesYAML | undefined
): MetadataRegisterAttributes | undefined => {
  if (!data) return undefined

  const results = Object.entries(data).map(([name, value]) => {
    const properties = importMetadataItemFromYAML({
      context,
      yaml: value as MetadataRegisterAttributeYAML,
      rule: MetadataRegisterAttributeRules,
      name,
    })

    if (properties == undefined) throw new Error("Properties are required")

    return {
      ...dropImplicitEmptySynonym(properties),
      name,
    }
  })

  return results.length > 0 ? (results as MetadataRegisterAttributes) : undefined
}

registerMetadataItemCollectionRule({
  propertyType: "MetadataRegisterAttributes",
  itemRule: MetadataRegisterAttributeRules,
  xmlElement: "Attribute",
  keyField: "name",
  fromYAML: importMetadataRegisterAttributesFromYAML,
  collectionItemRule: true,
})

export const importMetadataRegisterAttributesFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MetadataRegisterAttributesXML | undefined
): MetadataRegisterAttributes | undefined => {
  return importPropertyFromXML({
    context,
    rule: { type: "MetadataRegisterAttributes" },
    value: xml,
  }) as MetadataRegisterAttributes | undefined
}

export const exportMetadataRegisterAttributesToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataRegisterAttributes | undefined
): MetadataRegisterAttributesYAML | undefined => {
  return exportMetadataCollectionToYAMLAsRecord({
    context,
    data,
    itemRule: MetadataRegisterAttributeRules,
    keyField: "name",
  }) as MetadataRegisterAttributesYAML | undefined
}
