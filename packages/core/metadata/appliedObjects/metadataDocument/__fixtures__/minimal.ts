import { MetadataDocument, MetadataDocumentYAML } from "../types"

export const minimal: MetadataDocument = {
  actionsWritingOnPost: "WriteSelected",
  checkUnique: true,
  inputByString: ["Document.ДокументПоУмолчанию.StandardAttribute.Number"],
  itemType: "MetadataDocument",
  name: "ДокументПоУмолчанию",
  numberLength: 9,
  numberPeriodicity: "Nonperiodical",
  posting: "Allow",
  privilegedPostingMode: true,
  privilegedUnpostingMode: true,
  realTimePosting: "Allow",
  registerRecordsDeletion: "AutoDeleteOnUnpost",
}

export const minimalYAML: MetadataDocumentYAML = {
  ВводПоСтроке: ["СтандартныйРеквизит.Номер"],
  ДлинаНомера: 9,
  ЗаписьДвиженийПриПроведении: "ЗаписыватьВыбранные",
  КонтрольУникальности: "Истина",
  ОперативноеПроведение: "Разрешить",
  ПериодичностьНомера: "Непериодический",
  ПривилегированныйРежимПриОтменеПроведения: "Истина",
  ПривилегированныйРежимПриПроведении: "Истина",
  Проведение: "Разрешить",
  УдалениеДвижений: "УдалятьАвтоматическиПриОтменеПроведения",
}
