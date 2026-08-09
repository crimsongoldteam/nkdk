import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataDocumentJournalRules } from "./rules"

export type MetadataDocumentJournal = MetadataTypeByRule<typeof MetadataDocumentJournalRules>
export type MetadataDocumentJournalYAML = YAMLTypeByRule<typeof MetadataDocumentJournalRules>

registerMetadataItemRule({
  propertyType: "MetadataDocumentJournal",
  itemRule: MetadataDocumentJournalRules,
})
