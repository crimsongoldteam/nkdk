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
  Синоним: "",
  ВводПоСтроке: ["СтандартныйРеквизит.Номер"],
  Нумератор: "НумераторПоУмолчанию",
  СтандартныеРеквизиты: {
    Дата: {
      Синоним: "",
      ПроверкаЗаполнения: "ВыдаватьОшибку",
    },
    Номер: {
      Синоним: "",
    },
    Проведен: {
      Синоним: "",
    },
    Ссылка: {
      Синоним: "",
    },
    ПометкаУдаления: {
      Синоним: "",
    },
  } as MetadataDocumentYAML["СтандартныеРеквизиты"],
}
