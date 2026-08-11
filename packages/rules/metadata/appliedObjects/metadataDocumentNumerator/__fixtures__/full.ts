import { MetadataDocumentNumerator, MetadataDocumentNumeratorYAML } from "../types"

export const full: MetadataDocumentNumerator = {
  itemType: "MetadataDocumentNumerator",
  name: "НумераторДокументовВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  numberType: "Number",
  numberLength: 11,
  numberPeriodicity: "Year",
  checkUnique: false,
}

export const fullYAML: MetadataDocumentNumeratorYAML = {
  Синоним: "Синоним",
  Комментарий: "Комментарий",
  ТипНомера: "Число",
  ДлинаНомера: 11,
  ПериодичностьНомера: "Год",
  КонтрольУникальности: "Ложь",
}
