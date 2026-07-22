import { ConfigurationContext, ConfigurationContextFromXML } from "../../context/types"
import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "../../orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "../../orchestration/property/fromXML"
import type { PropertyRule } from "../../orchestration/property/types"
import { MetadataRegisterResourceRules } from "./rules"
import { MetadataRegisterResources, MetadataRegisterResourcesXML, MetadataRegisterResourcesYAML } from "./types"

registerMetadataItemCollectionRule({
  propertyType: "MetadataRegisterResources",
  itemRule: MetadataRegisterResourceRules,
  xmlElement: "Resource",
  keyField: "name",
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
