import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataDocumentJournalRules } from "./rules"

export type MetadataDocumentJournal = MetadataTypeByRule<typeof MetadataDocumentJournalRules>
export type MetadataDocumentJournalYAML = YAMLTypeByRule<typeof MetadataDocumentJournalRules>

registerMetadataItemRule({
  propertyType: "MetadataDocumentJournal",
  itemRule: MetadataDocumentJournalRules,
})
