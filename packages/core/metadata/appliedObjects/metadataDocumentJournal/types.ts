import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataDocumentJournalRules } from "./rules"

export type MetadataDocumentJournal = MetadataTypeByRule<typeof MetadataDocumentJournalRules>
export type MetadataDocumentJournalYAML = YAMLTypeByRule<typeof MetadataDocumentJournalRules>

registerMetadataItemRule({
  propertyType: "MetadataDocumentJournal",
  itemRule: MetadataDocumentJournalRules,
})
