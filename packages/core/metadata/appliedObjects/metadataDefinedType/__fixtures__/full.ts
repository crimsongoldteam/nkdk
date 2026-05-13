import { MetadataDefinedType, MetadataDefinedTypeYAML } from "../types"

export const full: MetadataDefinedType = {
  itemType: "MetadataDefinedType",
  name: "ОпределяемыйТипВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  type: {
    type: ["string", "decimal"],
    numberQualifiers: { digits: 10, fractionDigits: 0, allowedSign: "Any" },
    stringQualifiers: { length: 10, allowedLength: "Variable" },
  },
}

export const fullYAML: MetadataDefinedTypeYAML = {
  Синоним: "Синоним",
  Комментарий: "Комментарий",
  Тип: ["Строка(10)", "Число(10, 0)"],
}
