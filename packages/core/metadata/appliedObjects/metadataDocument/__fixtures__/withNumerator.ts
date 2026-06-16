import { MetadataDocument, MetadataDocumentYAML } from "../types"

export const withNumerator: MetadataDocument = {
  actionsWritingOnPost: "WriteSelected",
  checkUnique: true,
  inputByString: ["Document.ДокументСНумератором.StandardAttribute.Number"],
  itemType: "MetadataDocument",
  name: "ДокументСНумератором",
  numberLength: 9,
  numberPeriodicity: "Nonperiodical",
  numerator: "DocumentNumerator.НумераторПоУмолчанию" as MetadataDocument["numerator"],
  posting: "Allow",
  privilegedPostingMode: true,
  privilegedUnpostingMode: true,
  realTimePosting: "Allow",
  registerRecordsDeletion: "AutoDeleteOnUnpost",
  standardAttributes: [
    {
      fillChecking: "ShowError",
      itemType: "StandardAttributeDescription",
      name: "Date",
    },
  ],
}

export const withNumeratorYAML: MetadataDocumentYAML = {
  ВводПоСтроке: ["СтандартныйРеквизит.Номер"],
  ДлинаНомера: 9,
  ЗаписьДвиженийПриПроведении: "ЗаписыватьВыбранные",
  КонтрольУникальности: "Истина",
  Нумератор: "НумераторДокументов.НумераторПоУмолчанию",
  ОперативноеПроведение: "Разрешить",
  ПериодичностьНомера: "Непериодический",
  ПривилегированныйРежимПриОтменеПроведения: "Истина",
  ПривилегированныйРежимПриПроведении: "Истина",
  Проведение: "Разрешить",
  СтандартныеРеквизиты: {
    Дата: {
      ПроверкаЗаполнения: "ВыдаватьОшибку",
    },
  } as MetadataDocumentYAML["СтандартныеРеквизиты"],
  УдалениеДвижений: "УдалятьАвтоматическиПриОтменеПроведения",
}
