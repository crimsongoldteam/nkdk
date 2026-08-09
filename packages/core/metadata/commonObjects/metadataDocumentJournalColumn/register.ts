import { registerMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import { MetadataDocumentJournalColumnRules } from "./rules"

registerMetadataItemCollectionRule({
  propertyType: "MetadataDocumentJournalColumns",
  itemRule: MetadataDocumentJournalColumnRules,
  xmlElement: "Column",
  keyField: "name",
})
