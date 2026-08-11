import { MetadataSessionParameter, MetadataSessionParameterYAML } from "../types"

export const full: MetadataSessionParameter = {
  itemType: "MetadataSessionParameter",
  name: "ПараметрСеансаВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  type: {
    type: ["string"],
    stringQualifiers: { length: 10, allowedLength: "Variable" },
  },
}

export const fullYAML: MetadataSessionParameterYAML = {
  Синоним: "Синоним",
  Комментарий: "Комментарий",
  Тип: "Строка(10)",
}
