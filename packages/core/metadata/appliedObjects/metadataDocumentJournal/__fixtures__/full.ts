import { MetadataDocumentJournal, MetadataDocumentJournalYAML } from "../types"

export const full: MetadataDocumentJournal = {
  itemType: "MetadataDocumentJournal",
  name: "ЖурналДокументовВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  defaultForm: "DocumentJournal.ЖурналДокументовВсеСвойства.Form.ФормаСписка",
  useStandardCommands: false,
  registeredDocuments: ["Document.ДокументВсеСвойства", "Document.ДокументДругойДляЖурнала"],
  includeHelpInContents: true,
  standardAttributes: [
    {
      itemType: "StandardAttributeDescription",
      name: "Ref",
      synonym: { items: { ru: "Синоним ссылка" } },
    },
    {
      itemType: "StandardAttributeDescription",
      name: "Date",
      synonym: { items: { ru: "Синоним дата" } },
    },
  ],
  listPresentation: { items: { ru: "Представление списка" } },
  extendedListPresentation: { items: { ru: "Расширенное представление списка" } },
  explanation: { items: { ru: "Прояснение" } },
  columns: [
    {
      itemType: "MetadataDocumentJournalColumn",
      name: "ГрафаВсеСвойства",
      synonym: { items: { ru: "Синоним" } },
      comment: "Комментарий",
      references: [
        "Document.ДокументВсеСвойства.Attribute.РеквизитБулево",
        "Document.ДокументДругойДляЖурнала.Attribute.СтроковыйРеквизит",
      ],
      indexing: "IndexWithAdditionalOrder",
    },
    {
      itemType: "MetadataDocumentJournalColumn",
      name: "ГрафаПоУмолчанию",
      synonym: { items: { ru: "Графа по умолчанию" } },
      references: [
        "Document.ДокументВсеСвойства.Attribute.СтроковыйРеквизит",
        "Document.ДокументДругойДляЖурнала.Attribute.СтроковыйРеквизит",
      ],
    },
  ],
  commands: [
    {
      itemType: "MetadataCommand",
      name: "Команда1",
      group: "CommandGroup.ГруппаКомандПоУмолчанию",
    },
  ],
}

export const fullYAML: MetadataDocumentJournalYAML = {
  Синоним: "Синоним",
  Комментарий: "Комментарий",
  ОсновнаяФорма: "DocumentJournal.ЖурналДокументовВсеСвойства.Form.ФормаСписка",
  ИспользоватьСтандартныеКоманды: "Ложь",
  РегистрируемыеДокументы: ["Документ.ДокументВсеСвойства", "Документ.ДокументДругойДляЖурнала"],
  ВключатьСправкуВСодержание: "Истина",
  СтандартныеРеквизиты: {
    Ссылка: {
      Синоним: "Синоним ссылка",
    },
    Дата: {
      Синоним: "Синоним дата",
    },
  },
  ПредставлениеСписка: "Представление списка",
  РасширенноеПредставлениеСписка: "Расширенное представление списка",
  Пояснение: "Прояснение",
  Графы: {
    ГрафаВсеСвойства: {
      Синоним: "Синоним",
      Комментарий: "Комментарий",
      Ссылки: [
        "Документ.ДокументВсеСвойства.Реквизит.РеквизитБулево",
        "Документ.ДокументДругойДляЖурнала.Реквизит.СтроковыйРеквизит",
      ],
      Индексирование: "ИндексироватьСДопУпорядочиванием",
    },
    ГрафаПоУмолчанию: {
      Синоним: "Графа по умолчанию",
      Ссылки: [
        "Документ.ДокументВсеСвойства.Реквизит.СтроковыйРеквизит",
        "Документ.ДокументДругойДляЖурнала.Реквизит.СтроковыйРеквизит",
      ],
    },
  },
  Команды: {
    Команда1: {
      Группа: "ГруппаКоманд.ГруппаКомандПоУмолчанию",
    },
  },
}
