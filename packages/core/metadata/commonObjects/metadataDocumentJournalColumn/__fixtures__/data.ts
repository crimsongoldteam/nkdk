import {
  MetadataDocumentJournalColumns,
  MetadataDocumentJournalColumnsYAML,
} from "~/metadata/commonObjects/metadataDocumentJournalColumn/types"

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
    Синоним: "Документ",
    Комментарий: "Документ регистратора",
    Тип: "Документ.ДокументЗаказ",
    Ссылки: ["Документ.ДокументЗаказ.Реквизит.Контрагент"],
  },
  Контрагент: {
    Синоним: "Контрагент",
    Тип: "Справочник.Контрагенты",
    Ссылки: ["Документ.ДокументЗаказ.Реквизит.Контрагент", "Документ.ДокументРасход.Реквизит.Контрагент"],
    Индексирование: "Индексировать",
  },
}

export const columnsFromYAML: MetadataDocumentJournalColumns = [
  {
    itemType: "MetadataDocumentJournalColumn",
    name: "Документ",
    synonym: { items: { ru: "Документ" } },
    comment: "Документ регистратора",
    type: { type: ["DocumentRef.ДокументЗаказ"] },
    references: ["Document.ДокументЗаказ.Attribute.Контрагент"],
  },
  {
    itemType: "MetadataDocumentJournalColumn",
    name: "Контрагент",
    synonym: { items: { ru: "Контрагент" } },
    type: { type: ["CatalogRef.Контрагенты"] },
    references: ["Document.ДокументЗаказ.Attribute.Контрагент", "Document.ДокументРасход.Attribute.Контрагент"],
    indexing: "Index",
  },
]
