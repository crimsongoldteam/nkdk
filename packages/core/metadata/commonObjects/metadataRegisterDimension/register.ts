import { ConfigurationContext, ConfigurationContextFromXML } from "../../context/types"
import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "../../orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "../../orchestration/property/fromXML"
import type { PropertyRule } from "../../orchestration/property/types"
import { MetadataRegisterDimensionRules } from "./rules"
import { MetadataRegisterDimensions, MetadataRegisterDimensionsXML, MetadataRegisterDimensionsYAML } from "./types"

registerMetadataItemCollectionRule({
  propertyType: "MetadataRegisterDimensions",
  itemRule: MetadataRegisterDimensionRules,
  xmlElement: "Dimension",
  keyField: "name",
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
