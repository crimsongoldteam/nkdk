import { registerDataPathOwnerKind } from "~/metadata/validation/dataPath/registry"
import { MetadataDocumentJournalRules } from "./rules"

registerDataPathOwnerKind({
  kind: "ЖурналДокументов",
  projectDir: "ЖурналДокументов",
  rule: MetadataDocumentJournalRules,
})
