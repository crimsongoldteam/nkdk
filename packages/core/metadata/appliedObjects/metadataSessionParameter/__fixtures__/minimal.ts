import { MetadataSessionParameter, MetadataSessionParameterYAML } from "../types"

export const minimal: MetadataSessionParameter = {
  itemType: "MetadataSessionParameter",
  name: "ПараметрСеансаПоУмолчанию",
  synonym: { items: { ru: "Параметр сеанса по умолчанию" } },
  type: {
    type: ["string"],
    stringQualifiers: { length: 10, allowedLength: "Variable" },
  },
}

export const minimalYAML: MetadataSessionParameterYAML = {
  Синоним: "Параметр сеанса по умолчанию",
  Тип: "Строка(10)",
}
