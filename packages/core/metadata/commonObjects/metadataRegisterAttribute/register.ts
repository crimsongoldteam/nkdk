import { ConfigurationContext, ConfigurationContextFromXML } from "../../context/types"
import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "../../orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "../../orchestration/property/fromXML"
import type { PropertyRule } from "../../orchestration/property/types"
import { MetadataRegisterAttributeRules } from "./rules"
import { MetadataRegisterAttributes, MetadataRegisterAttributesXML, MetadataRegisterAttributesYAML } from "./types"

registerMetadataItemCollectionRule({
  propertyType: "MetadataRegisterAttributes",
  itemRule: MetadataRegisterAttributeRules,
  xmlElement: "Attribute",
  keyField: "name",
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
