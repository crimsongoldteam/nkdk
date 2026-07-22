import { ConfigurationContext, ConfigurationContextFromXML } from "../../context/types"
import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "../../orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "../../orchestration/property/fromXML"
import type { PropertyRule } from "../../orchestration/property/types"
import { MetadataSequenceDimensionRules } from "./rules"
import { MetadataSequenceDimensions, MetadataSequenceDimensionsXML, MetadataSequenceDimensionsYAML } from "./types"

registerMetadataItemCollectionRule({
  propertyType: "MetadataSequenceDimensions",
  itemRule: MetadataSequenceDimensionRules,
  xmlElement: "Dimension",
  keyField: "name",
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
