import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { MetadataDocumentJournalColumnRules } from "./rules"
import {
  MetadataDocumentJournalColumnYAML,
  MetadataDocumentJournalColumns,
  MetadataDocumentJournalColumnsXML,
  MetadataDocumentJournalColumnsYAML,
} from "./types"

const importMetadataDocumentJournalColumnsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataDocumentJournalColumnsYAML | undefined
): MetadataDocumentJournalColumns | undefined => {
  if (!data) return undefined

  const results = Object.entries(data).map(([name, value]) => {
    const properties = importMetadataItemFromYAML({
      context,
      yaml: value as MetadataDocumentJournalColumnYAML,
      rule: MetadataDocumentJournalColumnRules,
      name,
    })

    if (properties == undefined) throw new Error("Properties are required")

    return {
      ...properties,
      name,
    }
  })

  return results.length > 0 ? (results as MetadataDocumentJournalColumns) : undefined
}

registerMetadataItemCollectionRule({
  propertyType: "MetadataDocumentJournalColumns",
  itemRule: MetadataDocumentJournalColumnRules,
  xmlElement: "Column",
  keyField: "name",
  fromYAML: importMetadataDocumentJournalColumnsFromYAML,
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
