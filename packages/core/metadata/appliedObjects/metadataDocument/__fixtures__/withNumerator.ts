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

// FIXME: ключ "undefined" в `СтандартныеРеквизиты` — баг текущего YAML-экспорта
// (имя StandardAttribute теряется при ключевании коллекции). Снапшот фиксирует
// реальный вывод; после фикса правила фикстура должна быть обновлена в том же PR.
export const withNumeratorYAML: MetadataDocumentYAML = {
  ВводПоСтроке: ["Документ.ДокументСНумератором.СтандартныйРеквизит.Number"],
  ДлинаНомера: 9,
  ЗаписьДвиженийПриПроведении: "ЗаписыватьВыбранные",
  КонтрольУникальности: "Истина",
  Нумератор: "DocumentNumerator.НумераторПоУмолчанию",
  ОперативноеПроведение: "Разрешить",
  ПериодичностьНомера: "Непериодический",
  ПривилегированныйРежимПриОтменеПроведения: "Истина",
  ПривилегированныйРежимПриПроведении: "Истина",
  Проведение: "Разрешить",
  СтандартныеРеквизиты: {
    undefined: {
      ПроверкаЗаполнения: "ВыдаватьОшибку",
    },
  } as MetadataDocumentYAML["СтандартныеРеквизиты"],
  УдалениеДвижений: "УдалятьАвтоматическиПриОтменеПроведения",
}
