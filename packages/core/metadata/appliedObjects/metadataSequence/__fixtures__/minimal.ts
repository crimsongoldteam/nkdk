import { MetadataSequence, MetadataSequenceYAML } from "../types"

export const minimal: MetadataSequence = {
  itemType: "MetadataSequence",
  name: "ПоследовательностьПоУмолчанию",
  documents: ["Document.ДокументПоУмолчанию"],
  registerRecords: [],
}

export const minimalYAML: MetadataSequenceYAML = {
  Документы: ["Документ.ДокументПоУмолчанию"],
}
