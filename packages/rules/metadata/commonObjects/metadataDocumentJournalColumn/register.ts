import { defineMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import { MetadataDocumentJournalColumnRules } from "./rules"

export const metadataRuleLayer000 = defineMetadataItemCollectionRule({
  propertyType: "MetadataDocumentJournalColumns",
  itemRule: MetadataDocumentJournalColumnRules,
  xmlElement: "Column",
  keyField: "name",
})
