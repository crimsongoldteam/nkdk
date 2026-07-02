import { registerDataPathOwnerKind } from "../../validation/dataPath/registry"
import { MetadataDocumentJournalRules } from "./rules"

registerDataPathOwnerKind({
  kind: "ЖурналДокументов",
  projectDir: "ЖурналДокументов",
  rule: MetadataDocumentJournalRules,
})
