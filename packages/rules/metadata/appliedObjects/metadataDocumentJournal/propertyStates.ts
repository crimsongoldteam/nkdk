import { controlled, definePropertyStateItemCapabilities } from "../configurationExtension/propertyStateCapabilities"
import { MetadataDocumentJournalRules } from "./rules"

export const metadataDocumentJournalPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataDocumentJournalRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: controlled("registeredDocuments"),
})
