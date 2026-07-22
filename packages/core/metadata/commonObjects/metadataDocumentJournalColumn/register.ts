import { ConfigurationContext, ConfigurationContextFromXML } from "../../context/types"
import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "../../orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "../../orchestration/property/fromXML"
import type { PropertyRule } from "../../orchestration/property/types"
import { MetadataDocumentJournalColumnRules } from "./rules"
import {
  MetadataDocumentJournalColumns,
  MetadataDocumentJournalColumnsXML,
  MetadataDocumentJournalColumnsYAML,
} from "./types"

registerMetadataItemCollectionRule({
  propertyType: "MetadataDocumentJournalColumns",
  itemRule: MetadataDocumentJournalColumnRules,
  xmlElement: "Column",
  keyField: "name",
})

export const importMetadataDocumentJournalColumnsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MetadataDocumentJournalColumnsXML | undefined
): MetadataDocumentJournalColumns | undefined => {
  return importPropertyFromXML({
    context,
    rule: { type: "MetadataDocumentJournalColumns" },
    value: xml,
  }) as MetadataDocumentJournalColumns | undefined
}

export const exportMetadataDocumentJournalColumnsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataDocumentJournalColumns | undefined
): MetadataDocumentJournalColumnsYAML | undefined => {
  return exportMetadataCollectionToYAMLAsRecord({
    context,
    data,
    itemRule: MetadataDocumentJournalColumnRules,
    keyField: "name",
  }) as MetadataDocumentJournalColumnsYAML | undefined
}
