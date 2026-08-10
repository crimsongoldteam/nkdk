import { MetadataDocumentJournal, MetadataDocumentJournalYAML } from "../types"

export const minimal: MetadataDocumentJournal = {
  itemType: "MetadataDocumentJournal",
  name: "ЖурналДокументовПоУмолчанию",
  synonym: { items: { ru: "Журнал документов по умолчанию" } },
  registeredDocuments: ["Document.ДокументВсеСвойства"],
}

export const minimalYAML: MetadataDocumentJournalYAML = {
  РегистрируемыеДокументы: ["ДокументВсеСвойства"],
}
