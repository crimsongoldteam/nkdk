import { MetadataDocumentJournalColumns, MetadataDocumentJournalColumnsYAML } from "../types"

export const columnsFromXML: MetadataDocumentJournalColumns = [
  {
    itemType: "MetadataDocumentJournalColumn",
    name: "Документ",
    synonym: { items: { ru: "Документ" } },
    comment: "Документ регистратора",
    type: { type: ["DocumentRef.ДокументЗаказ"] },
    references: ["Document.ДокументЗаказ.Attribute.Контрагент"],
    objectBelonging: "Native",
  },
  {
    itemType: "MetadataDocumentJournalColumn",
    name: "Контрагент",
    synonym: { items: { ru: "Контрагент" } },
    type: { type: ["CatalogRef.Контрагенты"] },
    references: ["Document.ДокументЗаказ.Attribute.Контрагент", "Document.ДокументРасход.Attribute.Контрагент"],
    indexing: "Index",
    objectBelonging: "Native",
  },
]

export const columnsYAML: MetadataDocumentJournalColumnsYAML = {
  Документ: {
    Комментарий: "Документ регистратора",
    Тип: "Документ.ДокументЗаказ",
    Ссылки: ["Документ.ДокументЗаказ.Реквизит.Контрагент"],
  },
  Контрагент: {
    Тип: "Справочник.Контрагенты",
    Ссылки: ["Документ.ДокументЗаказ.Реквизит.Контрагент", "Документ.ДокументРасход.Реквизит.Контрагент"],
    Индексирование: "Индексировать",
  },
}

export const columnsFromYAML: MetadataDocumentJournalColumns = [
  {
    itemType: "MetadataDocumentJournalColumn",
    name: "Документ",
    comment: "Документ регистратора",
    type: { type: ["DocumentRef.ДокументЗаказ"] },
    references: ["Document.ДокументЗаказ.Attribute.Контрагент"],
  },
  {
    itemType: "MetadataDocumentJournalColumn",
    name: "Контрагент",
    type: { type: ["CatalogRef.Контрагенты"] },
    references: ["Document.ДокументЗаказ.Attribute.Контрагент", "Document.ДокументРасход.Attribute.Контрагент"],
    indexing: "Index",
  },
]
