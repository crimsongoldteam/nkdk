import { MetadataStyleItem, MetadataStyleItemYAML } from "../types"

export const color: MetadataStyleItem = {
  itemType: "MetadataStyleItem",
  name: "ЭлементСтиляЦвет",
  synonym: { items: { ru: "Элемент стиля цвет" } },
  type: "Color",
  value: {
    type: "Color",
    value: { type: "Absolute", value: "#8A31E2" },
  },
}

export const colorYAML: MetadataStyleItemYAML = {
  Тип: "Цвет",
  Значение: {
    Вид: "Цвет",
    Значение: "#8A31E2",
  },
}
