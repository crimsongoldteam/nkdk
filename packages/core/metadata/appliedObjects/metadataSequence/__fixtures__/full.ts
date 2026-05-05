import { MetadataSequence, MetadataSequenceYAML } from "../types"

export const full: MetadataSequence = {
  itemType: "MetadataSequence",
  name: "ПоследовательностьВсеПоля",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  moveBoundaryOnPosting: "DontMove",
  documents: ["Document.ДокументВсеСвойства"],
  registerRecords: ["InformationRegister.РегистрСведений1"],
  dataLockControlMode: "Automatic",
  dimensions: [
    {
      itemType: "MetadataSequenceDimension",
      name: "ИзмерениеПолное",
      synonym: { items: { ru: "Синоним" } },
      comment: "Комментарий",
      type: { type: ["string"], stringQualifiers: { length: 10, allowedLength: "Variable" } },
      documentMap: ["Document.ДокументВсеСвойства.Attribute.СтроковыйРеквизит"],
      registerRecordsMap: ["InformationRegister.РегистрСведений1.Dimension.Измерение1"],
    },
    {
      itemType: "MetadataSequenceDimension",
      name: "ИзмерениеПоУмолчанию",
      synonym: { items: { ru: "Измерение по умолчанию" } },
      type: { type: ["string"], stringQualifiers: { length: 10, allowedLength: "Variable" } },
    },
  ],
}

export const fullYAML: MetadataSequenceYAML = {
  Синоним: "Синоним",
  Комментарий: "Комментарий",
  ПеремещениеГраницыПриПроведении: "НеПеремещать",
  Документы: ["Документ.ДокументВсеСвойства"],
  Движения: ["РегистрСведений.РегистрСведений1"],
  РежимУправленияБлокировкойДанных: "Автоматический",
  Измерения: {
    ИзмерениеПолное: {
      Синоним: "Синоним",
      Комментарий: "Комментарий",
      Тип: "Строка(10)",
      СоответствиеРеквизитамДокументов: ["Документ.ДокументВсеСвойства.Реквизит.СтроковыйРеквизит"],
      СоответствиеРеквизитамДвижений: ["РегистрСведений.РегистрСведений1.Измерение.Измерение1"],
    },
    ИзмерениеПоУмолчанию: {
      Синоним: "Измерение по умолчанию",
      Тип: "Строка(10)",
    },
  },
}
