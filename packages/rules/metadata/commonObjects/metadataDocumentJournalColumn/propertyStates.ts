import { controlled, definePropertyStateItemCapabilities } from "../../ruleRuntime/definition/propertyStateDeclarations"
import { MetadataDocumentJournalColumnRules } from "./rules"

export const metadataDocumentJournalColumnPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataDocumentJournalColumnRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: controlled("type", "references"),
})
