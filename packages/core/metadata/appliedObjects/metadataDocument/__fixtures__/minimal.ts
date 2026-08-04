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
  Синоним: "",
  ВводПоСтроке: ["СтандартныйРеквизит.Номер"],
}
